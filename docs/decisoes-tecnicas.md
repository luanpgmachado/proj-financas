# Decisoes Tecnicas - v1

## POST /lancamentos

- usuario_id: o backend define `usuario_id` usando o valor fixo
  `00000000-0000-0000-0000-000000000001` em `app/main.py`.
  Qualquer valor enviado pelo cliente e ignorado e nao e persistido.
- Diferenciacao de tipos: o campo `tipo_lancamento` direciona a validacao
  e a estrutura persistida (ENTRADA, FIXO, VARIAVEL, PARCELADO).
- Campos extras enviados pelo cliente sao ignorados; apenas os campos
  validados sao persistidos.
- PARCELADO: sao persistidos apenas `valor_total`, `numero_parcelas`,
  `competencia`, `categoria_id` e `forma_pagamento_id`. Parcelas mensais
  nao sao armazenadas no v1; elas sao apenas derivadas para calculos futuros.
- Banco: SQLite em arquivo local (`data/financas.db`), com caminho
  configuravel por `FINANCAS_DB_PATH`.
- Onde roda: no mesmo host da API (local ou VM), sem servidor separado.
- Conexao: `sqlite3` da stdlib, abertura por request e `INSERT` direto
  na tabela `lancamentos`.
- Persistencia: tabela `lancamentos` guarda todos os campos do payload
  validado (inclui `valor` ou `valor_total` conforme o tipo). Os dados
  permanecem apos reinicio da aplicacao.
- Motivo da escolha: simplicidade operacional e compatibilidade com a VM
  sem depender de servicos externos no v1.
- Fora do escopo v1: autenticacao real, consolidacoes,
  automacoes e qualquer calculo de parcelas ou resumos.

## GET /lancamentos

- Ordenacao: a listagem retorna os registros ordenados por `data` em ordem
  decrescente, sem filtros ou paginacao no v1.

## GET /consolidacoes/mensal

- Calculo: o total_entradas soma `ENTRADA` por competencia; o total_gastos soma
  `FIXO` e `VARIAVEL` da competencia e adiciona a parcela derivada de cada
  `PARCELADO` cujo intervalo inclui a competencia solicitada.
- Parcelas: o valor da parcela e `valor_total / numero_parcelas` arredondado
  para 2 casas; a ultima parcela recebe o residuo para fechar o total.
- Investimentos: `total_investimentos` e 0 no v1 porque investimentos ainda
  nao sao persistidos.
- Persistencia: a consolidacao e calculada sob demanda e nao e armazenada,
  evitando tabela de resumo no v1.

## Ambiente na VM (Oracle Cloud)

- Comandos usados:
  - `sudo apt-get update`
  - `sudo apt-get install -y python3 python3-venv python3-pip`
  - `mkdir -p /home/ubuntu/financas-api`
  - `scp -i C:\Users\luanp\.ssh\oracle_dev_luan_private.key -r app requirements.txt ubuntu@137.131.233.220:/home/ubuntu/financas-api/`
  - `cd /home/ubuntu/financas-api && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt`
  - `mkdir -p /home/ubuntu/financas-api/data`
  - `cat > /home/ubuntu/financas-api/run_api.sh` (script para subir a API)
- Estrutura criada na VM:
  - `/home/ubuntu/financas-api/app`
  - `/home/ubuntu/financas-api/requirements.txt`
  - `/home/ubuntu/financas-api/.venv`
  - `/home/ubuntu/financas-api/data`
  - `/home/ubuntu/financas-api/run_api.sh`
- Como subir a API:
  - `ssh -i C:\Users\luanp\.ssh\oracle_dev_luan_private.key ubuntu@137.131.233.220`
  - `cd /home/ubuntu/financas-api && ./run_api.sh`
- Como parar a API:
  - interromper o processo com `Ctrl+C` no terminal onde o `uvicorn` esta rodando
  - ou usar `pkill -f \"uvicorn app.main:app\"`
