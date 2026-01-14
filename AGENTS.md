# Project Agents Rules

Este projeto utiliza **agents de IA separados por responsabilidade**.

## Regras gerais (válidas para TODOS os agents)

- Back-end é a **única fonte de verdade** para regras de negócio.
- Front-end **não implementa cálculos nem regras do domínio**.
- Infra **não altera código de aplicação**.
- Comunicação entre back-end e front-end ocorre **exclusivamente via OpenAPI**.
- O arquivo `contracts/openapi.v1.yaml` é o **contrato oficial**.
- Mudanças incompatíveis exigem **versionamento do contrato**.
- Nenhum agent deve atuar fora do seu escopo.
- Nenhum segredo ou credencial pode ser versionado.
- Trabalhar sempre dentro do diretório do projeto.
- Não executar comandos destrutivos sem solicitação explícita.

Estas regras são obrigatórias e permanentes.
