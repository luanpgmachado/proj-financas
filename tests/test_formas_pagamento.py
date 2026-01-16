import importlib

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


def test_criar_listar_formas_pagamento(client):
    payload = {"nome": "Cartao de credito"}
    response = client.post("/formas-pagamento", json=payload)
    assert response.status_code == 201
    created = response.json()
    assert created["nome"] == payload["nome"]
    assert "id" in created
    assert "usuario_id" in created

    list_response = client.get("/formas-pagamento")
    assert list_response.status_code == 200
    itens = list_response.json()
    assert len(itens) == 1
    assert itens[0]["id"] == created["id"]


def test_obter_forma_pagamento_invalida(client):
    response = client.get("/formas-pagamento/not-a-uuid")
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail[0]["loc"] == ["path", "forma_pagamento_id"]
    assert detail[0]["msg"] == "uuid invalido"


def test_atualizar_remover_forma_pagamento(client):
    response = client.post("/formas-pagamento", json={"nome": "Debito"})
    forma = response.json()

    update_response = client.put(
        f"/formas-pagamento/{forma['id']}",
        json={"nome": "Debito em conta"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["nome"] == "Debito em conta"

    delete_response = client.delete(f"/formas-pagamento/{forma['id']}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/formas-pagamento/{forma['id']}")
    assert get_response.status_code == 404


def test_forma_pagamento_nome_unico(client):
    payload = {"nome": "Pix"}
    first = client.post("/formas-pagamento", json=payload)
    assert first.status_code == 201

    second = client.post("/formas-pagamento", json=payload)
    assert second.status_code == 409
    assert second.json()["detail"] == "recurso ja existente"
