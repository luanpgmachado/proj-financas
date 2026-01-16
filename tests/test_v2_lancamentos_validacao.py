import importlib
import uuid

from fastapi.testclient import TestClient
import pytest


@pytest.fixture()
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "financas.db"
    monkeypatch.setenv("FINANCAS_DB_PATH", str(db_path))

    import app.db as db
    import app.main as main

    importlib.reload(db)
    importlib.reload(main)

    with TestClient(main.app) as test_client:
        yield test_client


def _criar_categoria(client):
    response = client.post("/categorias", json={"nome": "Mercado"})
    assert response.status_code == 201
    return response.json()


def _criar_forma_pagamento(client):
    response = client.post("/formas-pagamento", json={"nome": "Cartao"})
    assert response.status_code == 201
    return response.json()


def _payload_gasto(tipo, categoria_id, forma_pagamento_id):
    base = {
        "nome": "Despesa teste",
        "data": "2026-01-15",
        "competencia": "2026-01",
        "tipo_lancamento": tipo,
        "categoria_id": categoria_id,
        "forma_pagamento_id": forma_pagamento_id,
    }
    if tipo in {"FIXO", "VARIAVEL"}:
        base.update({"valor": 120.0, "pago": False})
    if tipo == "PARCELADO":
        base.update({"valor_total": 240.0, "numero_parcelas": 2})
    return base


def test_lancamento_gasto_com_categoria_inexistente(client):
    forma = _criar_forma_pagamento(client)
    categoria_id = str(uuid.uuid4())

    response = client.post(
        "/lancamentos",
        json=_payload_gasto("FIXO", categoria_id, forma["id"]),
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "categoria nao encontrada"


def test_lancamento_gasto_com_forma_inexistente(client):
    categoria = _criar_categoria(client)
    forma_id = str(uuid.uuid4())

    response = client.post(
        "/lancamentos",
        json=_payload_gasto("VARIAVEL", categoria["id"], forma_id),
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "forma de pagamento nao encontrada"


def test_lancamento_entrada_sem_referencias(client):
    response = client.post(
        "/lancamentos",
        json={
            "nome": "Salario",
            "data": "2026-01-10",
            "competencia": "2026-01",
            "tipo_lancamento": "ENTRADA",
            "valor": 5000.0,
        },
    )
    assert response.status_code == 201
