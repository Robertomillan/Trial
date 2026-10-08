# Referência salarial oficial no Salário.IA

A tela Premium consulta `salario-ia/market-data.json` por CBO e UF. O arquivo inicia vazio, de propósito: **não há percentis oficiais publicados no aplicativo até que os microdados sejam processados**.

Fonte: MTE/PDET, Novo CAGED (https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho/microdados-rais-e-caged).

O script `build_market_data.py` lê TXT oficiais `CAGEDMOV*.txt`, separados por ponto e vírgula, já extraídos dos arquivos .7z do MTE. Ele filtra admissões (+1), salário mensalizado positivo, CBO e UF e gera percentis agregados por ocupação e UF e por ocupação/Brasil, desde que haja pelo menos 30 registros.

Exemplo:

```bash
python3 build_market_data.py --input /dados/CAGEDMOV2025*.txt /dados/CAGEDMOV2026*.txt --start 202509 --end 202608 --min-sample 30 --output ../market-data.json
```

Antes de publicar dados, validar os arquivos de origem, período, cobertura e integridade. Não publicar microdados individuais.

**Limitações:** salários de admissão não representam remuneração de todos os vínculos; dados MOV não reconciliam arquivos FOR/EXC; CBO pode incluir diferentes senioridades; UF não é município; benefícios e PJ não aparecem na amostra. Para distribuição salarial de vínculos ativos, o próximo pipeline deve usar RAIS e seu conceito de remuneração. Os dados não devem ser rotulados como remuneração de mercado PJ.

CBOs iniciais: 142410 Gerente de suprimentos, 142405 Gerente de compras, 141615 Gerente de logística, 123405 Diretor de suprimentos, 354205 Comprador. Consulte a CBO oficial para ampliar a lista.
