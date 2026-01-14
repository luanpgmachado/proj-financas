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
- Autenticacao e simulada no v1 para controlar o fluxo de telas.

## Branch de Integracao (integration/v1)

Objetivo: consolidar back-end e front-end para validacao ponta a ponta do MVP v1.

Checklist de validacao manual do MVP:

- Subir o back-end localmente.
- Subir o front-end localmente.
- Criar lancamento pelo front-end.
- Visualizar lancamento na listagem.
- Validar tratamento de erro da API no front-end.