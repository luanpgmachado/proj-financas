# DEV-V2-2 — backend/v2-categorias-crud

## Escopo entregue
- CRUD completo de categorias com persistencia SQLite.
- Validacao de payload e path conforme contrato v2.
- Tratamento de conflitos por nome unico por usuario.

## Ajustes tecnicos
- Conexao SQLite agora fecha e confirma transacoes ao final do uso.

## Testes
- Nao executados (sugerido: `python -m unittest discover -s tests -v`)

## Observacoes
- Esta branch inclui implementacoes e testes de formas de pagamento e validacao referencial em lancamentos, que pertencem a DEV-V2-3 e DEV-V2-4 e devem ser separadas.
