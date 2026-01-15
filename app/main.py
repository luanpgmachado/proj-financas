from __future__ import annotations

from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
import re
import sqlite3
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException

from app.db import consolidacao_mensal, init_db, insert_lancamento, list_lancamentos

app = FastAPI(title="Financeiro B&L API", version="v1")

MOCK_USER_ID = "00000000-0000-0000-0000-000000000001"

TIPOS_LANCAMENTO = {"ENTRADA", "FIXO", "VARIAVEL", "PARCELADO"}
COMPETENCIA_FORMATO = "%Y-%m"
DATA_FORMATO = "%Y-%m-%d"
COMPETENCIA_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
DATA_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MONEY_QUANT = Decimal("0.01")


class PayloadValidationError(Exception):
    def __init__(self, errors: List[Dict[str, Any]]) -> None:
        super().__init__("payload validation error")
        self.errors = errors


def _add_error(errors: List[Dict[str, Any]], loc: List[str], msg: str, err_type: str) -> None:
    errors.append({"loc": loc, "msg": msg, "type": err_type})


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _require_string(payload: Dict[str, Any], field: str, errors: List[Dict[str, Any]]) -> Optional[str]:
    if field not in payload:
        _add_error(errors, ["body", field], "campo obrigatorio", "value_error.missing")
        return None
    value = payload[field]
    if not isinstance(value, str):
        _add_error(errors, ["body", field], "deve ser string", "type_error.string")
        return None
    if not value.strip():
        _add_error(errors, ["body", field], "nao pode ser vazio", "value_error")
        return None
    return value


def _require_date(
    payload: Dict[str, Any],
    field: str,
    errors: List[Dict[str, Any]],
    fmt: str,
    pattern: re.Pattern[str],
) -> Optional[str]:
    value = _require_string(payload, field, errors)
    if value is None:
        return None
    if not pattern.match(value):
        _add_error(errors, ["body", field], f"formato invalido ({fmt})", "value_error")
        return None
    try:
        datetime.strptime(value, fmt)
    except ValueError:
        _add_error(errors, ["body", field], f"formato invalido ({fmt})", "value_error")
        return None
    return value


def _require_uuid(payload: Dict[str, Any], field: str, errors: List[Dict[str, Any]]) -> Optional[str]:
    value = _require_string(payload, field, errors)
    if value is None:
        return None
    try:
        UUID(value)
    except ValueError:
        _add_error(errors, ["body", field], "uuid invalido", "value_error")
        return None
    return value


def _require_money(payload: Dict[str, Any], field: str, errors: List[Dict[str, Any]]) -> Optional[float]:
    if field not in payload:
        _add_error(errors, ["body", field], "campo obrigatorio", "value_error.missing")
        return None
    value = payload[field]
    if not _is_number(value):
        _add_error(errors, ["body", field], "deve ser numero", "type_error.number")
        return None
    if value < 0:
        _add_error(errors, ["body", field], "deve ser maior ou igual a zero", "value_error")
        return None
    return float(value)


def _require_int(payload: Dict[str, Any], field: str, errors: List[Dict[str, Any]]) -> Optional[int]:
    if field not in payload:
        _add_error(errors, ["body", field], "campo obrigatorio", "value_error.missing")
        return None
    value = payload[field]
    if not isinstance(value, int) or isinstance(value, bool):
        _add_error(errors, ["body", field], "deve ser inteiro", "type_error.integer")
        return None
    return value


def _require_bool(payload: Dict[str, Any], field: str, errors: List[Dict[str, Any]]) -> Optional[bool]:
    if field not in payload:
        _add_error(errors, ["body", field], "campo obrigatorio", "value_error.missing")
        return None
    value = payload[field]
    if not isinstance(value, bool):
        _add_error(errors, ["body", field], "deve ser booleano", "type_error.bool")
        return None
    return value


def _validate_payload(payload: Any) -> Dict[str, Any]:
    errors: List[Dict[str, Any]] = []
    if not isinstance(payload, dict):
        _add_error(errors, ["body"], "deve ser objeto JSON", "type_error.object")
        raise PayloadValidationError(errors)

    nome = _require_string(payload, "nome", errors)
    data = _require_date(payload, "data", errors, DATA_FORMATO, DATA_RE)
    competencia = _require_date(payload, "competencia", errors, COMPETENCIA_FORMATO, COMPETENCIA_RE)

    tipo_lancamento = _require_string(payload, "tipo_lancamento", errors)
    if tipo_lancamento and tipo_lancamento not in TIPOS_LANCAMENTO:
        _add_error(errors, ["body", "tipo_lancamento"], "tipo_lancamento invalido", "value_error")

    if errors:
        raise PayloadValidationError(errors)

    tipo_lancamento = str(tipo_lancamento)
    lancamento: Dict[str, Any] = {
        "id": str(uuid4()),
        "usuario_id": MOCK_USER_ID,
        "nome": nome,
        "data": data,
        "competencia": competencia,
        "tipo_lancamento": tipo_lancamento,
    }

    if tipo_lancamento == "ENTRADA":
        valor = _require_money(payload, "valor", errors)
        if errors:
            raise PayloadValidationError(errors)
        lancamento["valor"] = valor
        return lancamento

    categoria_id = _require_uuid(payload, "categoria_id", errors)
    forma_pagamento_id = _require_uuid(payload, "forma_pagamento_id", errors)

    if tipo_lancamento in {"FIXO", "VARIAVEL"}:
        valor = _require_money(payload, "valor", errors)
        pago = _require_bool(payload, "pago", errors)
        if errors:
            raise PayloadValidationError(errors)
        lancamento.update(
            {
                "categoria_id": categoria_id,
                "forma_pagamento_id": forma_pagamento_id,
                "valor": valor,
                "pago": pago,
            }
        )
        return lancamento

    if tipo_lancamento == "PARCELADO":
        valor_total = _require_money(payload, "valor_total", errors)
        numero_parcelas = _require_int(payload, "numero_parcelas", errors)
        if numero_parcelas is not None and numero_parcelas < 1:
            _add_error(
                errors,
                ["body", "numero_parcelas"],
                "deve ser maior ou igual a 1",
                "value_error",
            )
        if errors:
            raise PayloadValidationError(errors)
        lancamento.update(
            {
                "categoria_id": categoria_id,
                "forma_pagamento_id": forma_pagamento_id,
                "valor_total": valor_total,
                "numero_parcelas": numero_parcelas,
            }
        )
        return lancamento

    _add_error(errors, ["body", "tipo_lancamento"], "tipo_lancamento invalido", "value_error")
    raise PayloadValidationError(errors)


def _validate_competencia_param(competencia: Optional[str]) -> str:
    errors: List[Dict[str, Any]] = []
    if competencia is None:
        _add_error(errors, ["query", "competencia"], "campo obrigatorio", "value_error.missing")
        raise PayloadValidationError(errors)
    if not COMPETENCIA_RE.match(competencia):
        _add_error(errors, ["query", "competencia"], "formato invalido (YYYY-MM)", "value_error")
        raise PayloadValidationError(errors)
    try:
        datetime.strptime(competencia, COMPETENCIA_FORMATO)
    except ValueError:
        _add_error(errors, ["query", "competencia"], "formato invalido (YYYY-MM)", "value_error")
        raise PayloadValidationError(errors)
    return competencia


def _competencia_to_index(competencia: str) -> int:
    ano, mes = competencia.split("-")
    return int(ano) * 12 + int(mes) - 1


def _parcelado_valor_parcela(valor_total: Decimal, numero_parcelas: int, indice: int) -> Decimal:
    base = (valor_total / Decimal(numero_parcelas)).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)
    if indice == numero_parcelas - 1:
        residual = valor_total - base * Decimal(numero_parcelas - 1)
        return residual.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)
    return base


def _sum_parcelas(parcelados: List[Dict[str, Any]], competencia: str) -> Decimal:
    competencia_idx = _competencia_to_index(competencia)
    total = Decimal("0.00")
    for item in parcelados:
        inicio_idx = _competencia_to_index(item["competencia"])
        numero_parcelas = int(item["numero_parcelas"])
        indice = competencia_idx - inicio_idx
        if indice < 0 or indice >= numero_parcelas:
            continue
        valor_total = Decimal(str(item["valor_total"]))
        total += _parcelado_valor_parcela(valor_total, numero_parcelas, indice)
    return total


def _round_money(value: Decimal) -> float:
    return float(value.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP))


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.post("/lancamentos", status_code=201)
def criar_lancamento(payload: Dict[str, Any]) -> Dict[str, Any]:
    try:
        lancamento = _validate_payload(payload)
    except PayloadValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors) from exc

    insert_lancamento(lancamento)
    return lancamento


@app.get("/lancamentos")
def listar_lancamentos() -> List[Dict[str, Any]]:
    try:
        return list_lancamentos()
    except sqlite3.Error as exc:
        raise HTTPException(status_code=500, detail="erro ao acessar banco") from exc


@app.get("/consolidacoes/mensal")
def consolidar_mensal(competencia: Optional[str] = None) -> Dict[str, Any]:
    try:
        competencia_validada = _validate_competencia_param(competencia)
    except PayloadValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors) from exc

    dados = consolidacao_mensal(competencia_validada)
    total_entradas = Decimal(str(dados["total_entradas"]))
    total_gastos_base = Decimal(str(dados["total_gastos"]))
    total_parcelas = _sum_parcelas(dados["parcelados"], competencia_validada)
    total_gastos = total_gastos_base + total_parcelas
    total_investimentos = Decimal("0.00")
    saldo = total_entradas - total_gastos - total_investimentos

    return {
        "competencia": competencia_validada,
        "total_entradas": _round_money(total_entradas),
        "total_gastos": _round_money(total_gastos),
        "total_investimentos": _round_money(total_investimentos),
        "saldo": _round_money(saldo),
    }
