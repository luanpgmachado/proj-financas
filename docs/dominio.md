# Dominio Financeiro - v1 (MVP)

Este documento define o dominio funcional do sistema
Financeiro B&L - versao v1.

Ele e derivado de uma planilha financeira mensal/anual e
representa o escopo minimo necessario para implementar
o SaaS funcional inicial.

Este documento e a fonte de verdade do dominio.
Toda implementacao deve respeitar estas regras.

---

## Objetivo do Sistema

Permitir que usuarios controlem suas financas pessoais por meio de:

- registro de entradas e saidas
- categorizacao de gastos
- consolidacao mensal
- panorama anual
- controle de metas financeiras
- acompanhamento de investimentos

O sistema nao e contabil, nao e ERP e nao executa conciliacao bancaria no v1.

---

## Convencoes e Formatos

- Moeda unica: BRL.
- Valores monetarios sao decimais com 2 casas, sempre positivos.
- `data` usa o formato `YYYY-MM-DD`.
- `competencia` usa o formato `YYYY-MM`.
- `id` e `usuario_id` sao UUIDs em formato string.
- Todos os registros pertencem a um usuario. No v1, `usuario_id` e definido
  pelo contexto de autenticacao e nao e enviado/alterado pelo cliente.

---

## Entidades do Dominio

### Usuario

Representa o dono dos dados financeiros.

Atributos minimos:
- id
- nome
- email

Um usuario possui:
- lancamentos
- categorias
- formas de pagamento
- metas
- investimentos

---

### Lancamento Financeiro

Representa qualquer movimentacao financeira.

Tipos de lancamento:
- ENTRADA
- FIXO
- VARIAVEL
- PARCELADO

Regras gerais:
- O tipo do lancamento define o efeito no saldo.
- Gastos sao os tipos FIXO, VARIAVEL e PARCELADO.

Campos comuns:
- id
- nome
- data
- competencia
- tipo_lancamento
- categoria_id (obrigatoria para gastos, proibida para entrada)
- forma_pagamento_id (obrigatoria para gastos, proibida para entrada)
- pago (apenas para FIXO e VARIAVEL)
- usuario_id

#### Regras por tipo

**ENTRADA**
- aumenta o saldo
- `valor` obrigatorio
- nao possui categoria
- nao possui forma de pagamento
- nao usa `pago`

**FIXO / VARIAVEL**
- diminui o saldo
- `valor` obrigatorio
- possui categoria
- possui forma de pagamento
- pode ser marcado como pago

**PARCELADO**
- diminui o saldo por parcelas mensais
- possui categoria
- possui forma de pagamento
- nao usa `pago` no v1
- campos obrigatorios:
  - valor_total
  - numero_parcelas
- `competencia` indica o mes da primeira parcela
- o sistema deriva o valor de cada parcela:
  - valor_parcela = valor_total / numero_parcelas
  - arredondar para 2 casas
  - ajuste de residuo na ultima parcela
- as parcelas sao usadas apenas para calculo e consolidacao no v1
- o valor total nunca e duplicado

---

### Categoria

Classificacao de gastos.

Atributos:
- id
- nome
- usuario_id

Regras:
- aplicavel apenas a gastos
- nome e unico por usuario

---

### Forma de Pagamento

Forma como o gasto foi realizado.

Atributos:
- id
- nome
- usuario_id

Regras:
- aplicavel apenas a gastos
- nome e unico por usuario

---

### Meta Financeira

Representa um objetivo financeiro mensal.

Atributos:
- id
- nome
- valor_planejado
- competencia
- usuario_id

Regras:
- metas sao mensais
- a comparacao usa o total de gastos da mesma competencia

---

### Investimento

Representa valores alocados como investimento.

Atributos:
- id
- tipo (ex: reserva, renda fixa, renda variavel)
- valor
- data
- usuario_id

Regras:
- investimentos reduzem o saldo
- investimentos nao entram no calculo de gastos
- `competencia` do investimento e derivada de `data`

---

## Consolidacoes e Calculos

### Consolidacao Mensal

Para cada competencia (YYYY-MM), o sistema calcula:
- total_entradas = soma de ENTRADA
- total_gastos = soma de FIXO e VARIAVEL + parcelas de PARCELADO
- total_investimentos = soma de investimentos da competencia
- saldo = total_entradas - total_gastos - total_investimentos

### Panorama Anual

O panorama anual e a agregacao dos resumos mensais
dos 12 meses do ano.

---

## Limites do v1

- Nao ha automacao avancada.
- Nao ha fechamento de periodo.
- Nao ha auditoria.
- Nao ha integracao bancaria.
- Nao ha IA ou previsoes.

Esses itens sao tratados no roadmap.
