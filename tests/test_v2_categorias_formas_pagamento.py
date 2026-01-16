import importlib
import os
import sys
import tempfile
import unittest


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

