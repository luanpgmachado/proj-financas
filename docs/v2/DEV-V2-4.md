# DEV-V2-4 - backend/v2-lancamentos-validacao

## Escopo entregue
- Validacao referencial de categoria_id e forma_pagamento_id no POST /lancamentos.
- Retorno 404 quando categoria ou forma de pagamento nao existe.
- Mantida validacao 422 para erros de payload.

## Ajustes tecnicos
- Funcoes de existencia no SQLite para categorias e formas de pagamento.

## Testes
- `python -m pytest` (inclui validacao de referencias).
- `python -m unittest discover -s tests -v` (categorias).

## Observacoes
- ENTRADA nao exige categoria ou forma de pagamento.
