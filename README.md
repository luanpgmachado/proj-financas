# Financeiro B&L - Documentacao V1 (congelada)

Esta documentacao registra o escopo final entregue da V1 na branch integration/v1.
O conteudo esta congelado e descreve apenas o que foi implementado e validado.

## Escopo funcional (o que a V1 faz)

- API REST para lancamentos: POST `/lancamentos` (criacao) e GET `/lancamentos` (listagem).
- API REST para consolidacao mensal: GET `/consolidacoes/mensal?competencia=YYYY-MM`.
- Persistencia local via SQLite (arquivo `data/financas.db`, configuravel por `FINANCAS_DB_PATH`).
- Front-end web com fluxo de lancamentos (formulario e listagem) guiado pelo OpenAPI.
- Telas base de login, dashboard, categorias e investimentos.

## Limites conscientes da V1 (o que a V1 nao faz)

- CRUD incompleto: nao ha update ou delete de lancamentos, apenas Create + Read.
- Nao ha cadastro de categorias e formas de pagamento.
- IDs opacos sem validacao referencial (categoria_id e forma_pagamento_id apenas validam UUID).
- Nao ha autenticacao real; login e usuario sao simulados.
- Nao ha filtros, paginacao ou ordenacao na listagem de lancamentos.

## Decisoes arquiteturais

- API-first: back-end define regras de negocio; front-end apenas consome a API.
- OpenAPI em `contracts/openapi.v1.yaml` e a fonte unica de verdade da integracao.
- Front-end nao implementa calculos nem regras financeiras.
- `VITE_API_BASE_URL` e obrigatoria para o front-end se conectar ao back-end.
- Persistencia simples via SQLite, sem servicos externos.

## Contrato e responsabilidades

- Back-end e a unica fonte de verdade para regras financeiras.
- Front-end nao calcula e depende do OpenAPI para definir telas e campos.
- `contracts/openapi.v1.yaml` descreve endpoints e schemas disponiveis.

## Como rodar localmente

API (FastAPI):

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Front-end (Vite):

```bash
VITE_API_BASE_URL=/api
API_PROXY_TARGET=http://localhost:8000
```

```bash
npm install
npm run dev
```

Build de producao:

```bash
npm run build
```

Preview do build:

```bash
npm run preview
```

## Observacoes

- Em dev, `VITE_API_BASE_URL=/api` ativa o proxy do Vite para `API_PROXY_TARGET` e evita CORS.
- O bloco `servers` do OpenAPI e apenas referencia conceitual, nao define ambiente real.
