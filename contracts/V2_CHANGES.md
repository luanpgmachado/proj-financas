# Mudancas da V1 para V2

## Escopo funcional

A V2 adiciona os dominios de categorias e formas de pagamento como recursos CRUD,
sem alterar o comportamento dos lancamentos e consolidacoes existentes na V1.

## Novos endpoints

Categorias
- POST /categorias
- GET /categorias
- GET /categorias/{categoria_id}
- PUT /categorias/{categoria_id}
- DELETE /categorias/{categoria_id}

Formas de pagamento
- POST /formas-pagamento
- GET /formas-pagamento
- GET /formas-pagamento/{forma_pagamento_id}
- PUT /formas-pagamento/{forma_pagamento_id}
- DELETE /formas-pagamento/{forma_pagamento_id}

## Relacao dos lancamentos com categorias e formas de pagamento

- Lancamentos de gasto (FIXO, VARIAVEL, PARCELADO) continuam exigindo
  categoria_id e forma_pagamento_id.
- Na V2, esses ids devem referenciar recursos existentes em:
  - /categorias/{categoria_id}
  - /formas-pagamento/{forma_pagamento_id}
- Lancamentos do tipo ENTRADA continuam sem categoria ou forma de pagamento.

## Breaking changes

Nenhuma. A V2 apenas adiciona recursos e mantem o contrato da V1 preservado
em contracts/openapi.v1.yaml.
