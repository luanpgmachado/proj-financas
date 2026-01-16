# AGENTS

Regras do projeto:

- Projeto usa agentes separados por responsabilidade: back-end, front-end, infra, contract.
- Back-end e a unica fonte de verdade para regras de negocio.
- Front-end nao implementa logica de calculo.
- Toda a comunicacao do agent deve ser em portugues (pt-BR).
- E proibido responder em ingles.
- Se alguma ferramenta ou log retornar texto em ingles, explicar o significado em portugues.
- Comunicacao ocorre exclusivamente via OpenAPI em `contracts/openapi.v1.yaml`.
- Nenhum agent deve modificar arquivos fora da sua responsabilidade.
- Nenhum comando destrutivo sem solicitacao explicita.
- Trabalhar sempre dentro do diretorio do projeto.
- Segredos e credenciais nunca devem ser commitados.
