# DEV-V2-2 — backend/v2-categorias-crud

## Escopo entregue
- CRUD completo de categorias e formas de pagamento com persistencia SQLite.
- Validacao referencial em `POST /lancamentos` para categoria_id e forma_pagamento_id.
- Tratamento de conflitos por nome unico por usuario.

## Ajustes tecnicos
- Conexao SQLite agora fecha e confirma transacoes ao final do uso.
- Suite de testes automatizados criada para categorias, formas de pagamento e referencia em lancamentos.

## Testes executados
- `python -m unittest discover -s tests -v`
