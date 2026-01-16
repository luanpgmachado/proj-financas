# DEV-V2-3 — Formas de Pagamento (CRUD)

## Escopo
- CRUD completo de formas de pagamento no back-end.
- Persistencia em SQLite com unicidade por usuario.
- Validacao de payload e paths conforme contrato v2.

## Endpoints
- POST `/formas-pagamento`
- GET `/formas-pagamento`
- GET `/formas-pagamento/{forma_pagamento_id}`
- PUT `/formas-pagamento/{forma_pagamento_id}`
- DELETE `/formas-pagamento/{forma_pagamento_id}`

## Regras
- `nome` e obrigatorio e nao pode ser vazio.
- `nome` deve ser unico por usuario.
- `forma_pagamento_id` deve ser UUID valido nos endpoints com path.

## Persistencia
- Tabela `formas_pagamento` com colunas `id`, `usuario_id`, `nome`.
- Restricao `UNIQUE(usuario_id, nome)` para garantir unicidade.

## Testes
- `python -m pytest`

## Observacoes
- Usuario segue simulado por `MOCK_USER_ID`.
