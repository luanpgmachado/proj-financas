# Dominio do Front-end - Financeiro B&L (v1)

Este documento define o escopo e as responsabilidades
exclusivas do front-end do sistema Financeiro B&L.

O front-end e um cliente da API.
Ele nao e fonte de verdade de regras financeiras.

---

## Responsabilidade do Front-end

- Renderizar dados fornecidos pela API.
- Coletar dados do usuario e enviar para a API.
- Gerenciar navegacao, estado de tela e experiencia do usuario.
- Exibir feedbacks visuais (sucesso, erro, carregamento).

---

## O que o Front-end NAO faz

- Nao calcula saldo oficial.
- Nao consolida valores financeiros.
- Nao valida regras de negocio complexas.
- Nao persiste dados financeiros localmente.
- Nao altera dados fora do contrato OpenAPI.

---

## Autenticacao (v1)

- Autenticacao e simulada.
- Nao ha token, sessao ou usuario real.
- O objetivo e apenas controlar fluxo de telas.

---

## Integracao com Back-end

- Toda integracao ocorre via HTTP.
- O contrato oficial e contracts/openapi.v1.yaml.
- Se um dado nao existir no contrato, o front nao improvisa.

---

## Estrutura de Telas (v1)

- Login (simulado)
- Dashboard (estatico/semi-dinamico)
- Lancamentos (GET e POST reais)
- Categorias (mockado)
- Investimentos (mockado)

---

## Evolucao

Qualquer nova funcionalidade do front depende de:
1) Back-end implementar endpoint
2) Contrato OpenAPI atualizado
3) Front consumir o novo contrato

Este fluxo e obrigatorio.
