from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence

BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = os.getenv("FINANCAS_DB_PATH", str(BASE_DIR / "data" / "financas.db"))


def _ensure_db_path() -> None:
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)


def get_connection() -> sqlite3.Connection:
    return sqlite3.connect(DB_PATH)


def init_db() -> None:
    _ensure_db_path()
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS lancamentos (
                id TEXT PRIMARY KEY,
                usuario_id TEXT NOT NULL,
                nome TEXT NOT NULL,
                data TEXT NOT NULL,
                competencia TEXT NOT NULL,
                tipo_lancamento TEXT NOT NULL,
                categoria_id TEXT,
                forma_pagamento_id TEXT,
                valor REAL,
                pago INTEGER,
                valor_total REAL,
                numero_parcelas INTEGER
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS formas_pagamento (
                id TEXT PRIMARY KEY,
                usuario_id TEXT NOT NULL,
                nome TEXT NOT NULL,
                UNIQUE(usuario_id, nome)
            )
            """
        )


def insert_lancamento(lancamento: Dict[str, Any]) -> None:
    pago = None
    if "pago" in lancamento:
        pago = 1 if lancamento["pago"] else 0

    payload = {
        "id": lancamento["id"],
        "usuario_id": lancamento["usuario_id"],
        "nome": lancamento["nome"],
        "data": lancamento["data"],
        "competencia": lancamento["competencia"],
        "tipo_lancamento": lancamento["tipo_lancamento"],
        "categoria_id": lancamento.get("categoria_id"),
        "forma_pagamento_id": lancamento.get("forma_pagamento_id"),
        "valor": lancamento.get("valor"),
        "pago": pago,
        "valor_total": lancamento.get("valor_total"),
        "numero_parcelas": lancamento.get("numero_parcelas"),
    }

    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO lancamentos (
                id,
                usuario_id,
                nome,
                data,
                competencia,
                tipo_lancamento,
                categoria_id,
                forma_pagamento_id,
                valor,
                pago,
                valor_total,
                numero_parcelas
            ) VALUES (
                :id,
                :usuario_id,
                :nome,
                :data,
                :competencia,
                :tipo_lancamento,
                :categoria_id,
                :forma_pagamento_id,
                :valor,
                :pago,
                :valor_total,
                :numero_parcelas
            )
            """,
            payload,
        )


def list_lancamentos() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            """
            SELECT
                id,
                usuario_id,
                nome,
                data,
                competencia,
                tipo_lancamento,
                categoria_id,
                forma_pagamento_id,
                valor,
                pago,
                valor_total,
                numero_parcelas
            FROM lancamentos
            """
        ).fetchall()

    itens: List[Dict[str, Any]] = []
    for row in rows:
        item: Dict[str, Any] = {
            "id": row["id"],
            "usuario_id": row["usuario_id"],
            "nome": row["nome"],
            "data": row["data"],
            "competencia": row["competencia"],
            "tipo_lancamento": row["tipo_lancamento"],
        }

        tipo = row["tipo_lancamento"]
        if tipo == "ENTRADA":
            item["valor"] = row["valor"]
        elif tipo in {"FIXO", "VARIAVEL"}:
            item["categoria_id"] = row["categoria_id"]
            item["forma_pagamento_id"] = row["forma_pagamento_id"]
            item["valor"] = row["valor"]
            item["pago"] = bool(row["pago"])
        elif tipo == "PARCELADO":
            item["categoria_id"] = row["categoria_id"]
            item["forma_pagamento_id"] = row["forma_pagamento_id"]
            item["valor_total"] = row["valor_total"]
            item["numero_parcelas"] = row["numero_parcelas"]

        itens.append(item)

    return itens


def insert_forma_pagamento(forma_pagamento: Dict[str, Any]) -> None:
    payload = {
        "id": forma_pagamento["id"],
        "usuario_id": forma_pagamento["usuario_id"],
        "nome": forma_pagamento["nome"],
    }
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO formas_pagamento (
                id,
                usuario_id,
                nome
            ) VALUES (
                :id,
                :usuario_id,
                :nome
            )
            """,
            payload,
        )


def list_formas_pagamento(usuario_id: str) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            """
            SELECT id, usuario_id, nome
            FROM formas_pagamento
            WHERE usuario_id = ?
            """,
            (usuario_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def get_forma_pagamento(forma_pagamento_id: str, usuario_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            """
            SELECT id, usuario_id, nome
            FROM formas_pagamento
            WHERE id = ? AND usuario_id = ?
            """,
            (forma_pagamento_id, usuario_id),
        ).fetchone()
    return dict(row) if row else None


def update_forma_pagamento(
    forma_pagamento_id: str,
    usuario_id: str,
    nome: str,
) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        conn.row_factory = sqlite3.Row
        existing = conn.execute(
            """
            SELECT id, usuario_id, nome
            FROM formas_pagamento
            WHERE id = ? AND usuario_id = ?
            """,
            (forma_pagamento_id, usuario_id),
        ).fetchone()
        if existing is None:
            return None
        conn.execute(
            """
            UPDATE formas_pagamento
            SET nome = ?
            WHERE id = ? AND usuario_id = ?
            """,
            (nome, forma_pagamento_id, usuario_id),
        )
        row = conn.execute(
            """
            SELECT id, usuario_id, nome
            FROM formas_pagamento
            WHERE id = ? AND usuario_id = ?
            """,
            (forma_pagamento_id, usuario_id),
        ).fetchone()
    return dict(row) if row else None


def delete_forma_pagamento(forma_pagamento_id: str, usuario_id: str) -> bool:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            DELETE FROM formas_pagamento
            WHERE id = ? AND usuario_id = ?
            """,
            (forma_pagamento_id, usuario_id),
        )
    return cursor.rowcount > 0


def _sum_valores_por_tipo(competencia: str, tipos: Sequence[str]) -> float:
    placeholders = ", ".join("?" for _ in tipos)
    query = f"""
        SELECT COALESCE(SUM(valor), 0)
        FROM lancamentos
        WHERE competencia = ?
          AND tipo_lancamento IN ({placeholders})
    """
    params = [competencia, *tipos]
    with get_connection() as conn:
        row = conn.execute(query, params).fetchone()
    return float(row[0] or 0)


def list_parcelados_ate_competencia(competencia: str) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            """
            SELECT competencia, valor_total, numero_parcelas
            FROM lancamentos
            WHERE tipo_lancamento = 'PARCELADO'
              AND competencia <= ?
            """,
            (competencia,),
        ).fetchall()
    return [dict(row) for row in rows]


def consolidacao_mensal(competencia: str) -> Dict[str, Any]:
    total_entradas = _sum_valores_por_tipo(competencia, ["ENTRADA"])
    total_gastos = _sum_valores_por_tipo(competencia, ["FIXO", "VARIAVEL"])
    parcelados = list_parcelados_ate_competencia(competencia)
    return {
        "total_entradas": total_entradas,
        "total_gastos": total_gastos,
        "parcelados": parcelados,
    }
