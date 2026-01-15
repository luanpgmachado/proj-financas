# Financeiro B&L - Front-end (MVP v1)

Interface web do sistema Financeiro B&L.
O front-end consome exclusivamente o contrato OpenAPI definido em `contracts/openapi.v1.yaml`.

## Objetivo

- Visualizar lancamentos existentes.
- Criar novos lancamentos.
- Navegar pelas telas base do sistema.
- Manter autenticacao simulada no v1 (sem integracao real).

## Regras de dominio

- O back-end e a unica fonte de verdade para regras financeiras.
- O front-end nao implementa calculos ou regras de negocio.
- Qualquer nova integracao exige atualizacao do contrato OpenAPI.

## Stack

- React + Vite
- Tailwind CSS
- React Router

## Como rodar

Configure a variavel obrigatoria `VITE_API_BASE_URL` (ex: backend local na
porta 8000). Copie `.env.example` para `.env` e ajuste se necessario:

```bash
VITE_API_BASE_URL=http://localhost:8000
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

- A tela de Lancamentos habilita listagem e formulario somente quando o
  endpoint `/lancamentos` estiver definido no OpenAPI.
- O front-end exige `VITE_API_BASE_URL` para falar com o backend. O `servers`
  do OpenAPI e apenas referencia conceitual (nao define ambiente real).
- Autenticacao e simulada no v1 para controlar o fluxo de telas.

## Branch de Integracao (integration/v1)

Objetivo: consolidar back-end e front-end para validacao ponta a ponta do MVP v1.

Checklist de validacao manual do MVP:

- Subir o back-end localmente.
- Subir o front-end localmente.
- Criar lancamento pelo front-end.
- Visualizar lancamento na listagem.
- Validar tratamento de erro da API no front-end.
