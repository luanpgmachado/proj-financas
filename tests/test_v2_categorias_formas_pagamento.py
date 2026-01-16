import importlib
import os
import sys
import tempfile
import unittest
from uuid import uuid4


def _build_client():
    temp_dir = tempfile.TemporaryDirectory()
    db_path = os.path.join(temp_dir.name, "financas.db")
    os.environ["FINANCAS_DB_PATH"] = db_path
    sys.modules.pop("app.db", None)
    sys.modules.pop("app.main", None)
    importlib.invalidate_caches()
    from fastapi.testclient import TestClient
    from app.main import app

    return TestClient(app), temp_dir


class BaseApiTest(unittest.TestCase):
    def setUp(self):
        self.client, self._temp_dir = _build_client()
        self.client.__enter__()

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self._temp_dir.cleanup()


class CategoriasCrudTest(BaseApiTest):
    def test_crud_categorias(self):
        response = self.client.post("/categorias", json={"nome": "Mercado"})
        self.assertEqual(response.status_code, 201)
        categoria = response.json()
        self.assertEqual(categoria["nome"], "Mercado")

        response = self.client.get("/categorias")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

        response = self.client.get(f"/categorias/{categoria['id']}")
        self.assertEqual(response.status_code, 200)

        response = self.client.put(
            f"/categorias/{categoria['id']}",
            json={"nome": "Supermercado"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["nome"], "Supermercado")

        response = self.client.delete(f"/categorias/{categoria['id']}")
        self.assertEqual(response.status_code, 204)

        response = self.client.get(f"/categorias/{categoria['id']}")
        self.assertEqual(response.status_code, 404)


class FormasPagamentoCrudTest(BaseApiTest):
    def test_crud_formas_pagamento(self):
        response = self.client.post("/formas-pagamento", json={"nome": "Credito"})
        self.assertEqual(response.status_code, 201)
        forma = response.json()
        self.assertEqual(forma["nome"], "Credito")

        response = self.client.get("/formas-pagamento")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

        response = self.client.get(f"/formas-pagamento/{forma['id']}")
        self.assertEqual(response.status_code, 200)

        response = self.client.put(
            f"/formas-pagamento/{forma['id']}",
            json={"nome": "Debito"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["nome"], "Debito")

        response = self.client.delete(f"/formas-pagamento/{forma['id']}")
        self.assertEqual(response.status_code, 204)

        response = self.client.get(f"/formas-pagamento/{forma['id']}")
        self.assertEqual(response.status_code, 404)


class LancamentosReferenciaTest(BaseApiTest):
    def test_lancamento_referencia_invalida_retorna_404(self):
        payload = {
            "nome": "Conta luz",
            "data": "2024-02-10",
            "competencia": "2024-02",
            "tipo_lancamento": "FIXO",
            "categoria_id": str(uuid4()),
            "forma_pagamento_id": str(uuid4()),
            "valor": 120.5,
            "pago": True,
        }
        response = self.client.post("/lancamentos", json=payload)
        self.assertEqual(response.status_code, 404)

    def test_lancamento_referencia_valida_retorna_201(self):
        response = self.client.post("/categorias", json={"nome": "Moradia"})
        categoria_id = response.json()["id"]
        response = self.client.post("/formas-pagamento", json={"nome": "Boleto"})
        forma_id = response.json()["id"]

        payload = {
            "nome": "Aluguel",
            "data": "2024-02-05",
            "competencia": "2024-02",
            "tipo_lancamento": "FIXO",
            "categoria_id": categoria_id,
            "forma_pagamento_id": forma_id,
            "valor": 1500.0,
            "pago": True,
        }
        response = self.client.post("/lancamentos", json=payload)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["categoria_id"], categoria_id)
