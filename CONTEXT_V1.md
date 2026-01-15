CONTEXTO GERAL — PROJETO FINANCEIRO B&L (V1)

Este contexto descreve o estado atual, decisões tomadas e regras do projeto.
Leia tudo antes de executar qualquer tarefa.

===============================================================================
REGRAS DE COMUNICAÇÃO (OBRIGATÓRIAS)
===============================================================================

- TODA a comunicação do agent DEVE ser feita em português (pt-BR).
- É PROIBIDO responder em inglês.
- É PROIBIDO misturar idiomas.
- Nomes de variáveis, funções, arquivos, comandos e keywords técnicas permanecem em inglês.
- Explicações, análises, decisões, respostas e comentários devem ser sempre em português.
- Caso alguma ferramenta ou log retorne texto em inglês, o agent DEVE explicar o significado em português.
- Se o agent não conseguir cumprir esta regra, deve interromper a execução e informar o problema.

===============================================================================
VISÃO GERAL
===============================================================================

Projeto: Financeiro B&L  
Tipo: SaaS financeiro pessoal (MVP V1)

Objetivo da V1:  
Permitir criar e listar lançamentos financeiros (entradas e gastos) via API REST,
consumidos por um front-end web, com validação ponta a ponta.

O projeto evoluiu de uma planilha financeira para uma arquitetura API-first,
com contrato OpenAPI como fonte única de integração.

===============================================================================
STACK
===============================================================================

Back-end

- Python
- FastAPI
- SQLite (persistência local)
- OpenAPI 3.0 (openapi.v1.yaml)
- Persistência real (não em memória)

Endpoint existente:
- POST /lancamentos

Endpoint ainda pendente na V1:
- GET /lancamentos

Front-end

- Vite
- React
- Tailwind CSS
- Autenticação simulada

Layout com:
- Login
- Dashboard
- Lançamentos
- Categorias
- Investimentos

Regras:
- Front-end NÃO implementa regras de negócio
- Formulários e telas dependem exclusivamente do OpenAPI

Infra

- Oracle Cloud Free VM
- Acesso via SSH:

  ssh -i C:\Users\luanp\.ssh\oracle_dev_luan_private.key ubuntu@137.131.233.220

- API já foi executada com sucesso na VM
- Não há CI/CD na V1

===============================================================================
ARQUITETURA DE BRANCHES
===============================================================================

main
- Apenas contratos, prompts e documentação
- Não contém código executável do MVP

feature/back-end-v1
- Desenvolvimento inicial do back-end
- NÃO deve mais ser usada

feature/front-end-v1
- Desenvolvimento inicial do front-end
- NÃO deve mais ser usada

integration/v1
- Branch ativa atual
- Contém back-end + front-end integrados
- TODAS as correções da V1 devem ocorrer aqui
- Somente após validação humana haverá merge para main

===============================================================================
REGRAS DE TRABALHO COM AGENTS
===============================================================================

- Cada task = um chat novo
- Cada chat = um agent + um objetivo
- Agents NÃO decidem escopo
- Agents NÃO alteram domínio
- OpenAPI é a lei
- Front-end não calcula
- Back-end é a única fonte da verdade
- Nada deve ser feito fora da branch integration/v1

===============================================================================
GESTÃO DE TAREFAS (LINEAR)
===============================================================================

Ferramenta: Linear  
Projeto: Financeiro B&L  
Team: Dev-luan  

Workflow (em português):
- Backlog
- Pronto
- Em Andamento
- Revisão
- Concluído
- Cancelado (obrigatório pelo Linear)

Labels padrão:
- backend
- frontend
- infra
- docs
- integration
- v1

Campos customizados (preenchidos manualmente):
- Branch (texto)
- Agent (backend, frontend, infra, integration)
- Tipo de Task (feature, fix, doc, setup)

===============================================================================
ISSUES DA V1 (CRIADAS)
===============================================================================

Todas estão no status Backlog:

- DEV-5 — Expor endpoint GET /lancamentos
- DEV-6 — Atualizar OpenAPI com GET /lancamentos
- DEV-7 — Conectar listagem de lançamentos ao backend
- DEV-8 — Conectar criação de lançamento ao POST /lancamentos
- DEV-9 — Validar fluxo completo de lançamentos (manual)
- DEV-10 — Congelar documentação da V1

Fluxo correto:
1. Você move a issue para Pronto
2. Dispara o agent correspondente
3. Agent executa
4. Você valida
5. Issue vai para Concluído

===============================================================================
DEFINIÇÃO DE “V1 PRONTA”
===============================================================================

A V1 só é considerada pronta quando:

- Back-end sobe
- Front-end sobe
- Front cria lançamento via API
- Lançamento aparece na listagem
- Erros de validação da API aparecem no front
- Front não calcula nada
- Validação manual realizada na integration/v1

===============================================================================
EXECUÇÃO DE TAREFAS
===============================================================================

A issue a ser executada, o agent responsável e a branch ativa
SERÃO SEMPRE informados explicitamente no prompt do chat.

Este arquivo NÃO define ordem de execução de issues.


FIM DO CONTEXTO
