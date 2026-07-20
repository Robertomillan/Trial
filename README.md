# Career OS

**Sistema Operacional de Carreira para profissionais de média e alta liderança.**

Career OS transforma a recolocação executiva — hoje fragmentada em dezenas de plataformas, currículos genéricos e candidaturas sem retorno — em uma jornada única, orquestrada e mensurável. Ele combina **Executive Search, Inteligência de Mercado, Otimização de ATS, Planejamento de Carreira, CRM de Candidaturas e IA** para agir como um *consultor estratégico*, não como um buscador de vagas.

> Autor: Roberto Millan Pereira de Brito · Versão do produto: 1.1 · Status: Draft evoluído · Última atualização: Julho/2026

---

## Por que esta documentação existe

O PRD original (v1.0) terminava com uma recomendação clara: **não parar no PRD**. Para que o Career OS possa, daqui a um ano, ser um GPT, uma web app, um SaaS, um app ou um agente com MCP — ou tudo isso ao mesmo tempo — a especificação precisa ser **independente de tecnologia**.

Este repositório entrega exatamente esse pacote: o produto documentado em nível de software, pronto tanto para virar um GPT hoje quanto uma plataforma amanhã.

## Mapa da documentação

| # | Documento | O que responde |
|---|-----------|----------------|
| 00 | [PRD](docs/00-PRD.md) | **O que** o produto faz, para quem, e o que está fora de escopo |
| 01 | [Arquitetura Funcional](docs/01-Arquitetura-Funcional.md) | **Como** o Career Core e os 11 módulos se relacionam |
| 02 | [Decision Engine](docs/02-Decision-Engine.md) | As **regras de decisão**: Match Score, ATS Score, GAP, Readiness |
| 03 | [Modelo de Dados](docs/03-Modelo-de-Dados.md) | As **entidades**: Candidato, Vaga, Empresa, Candidatura, Entrevista… |
| 04 | [System Prompt Master](docs/04-System-Prompt-Master.md) | A **identidade e o comportamento** do Career OS como agente |
| 05 | [Prompts dos Módulos](docs/05-Prompts-Modulos/) | Um **prompt operável** para cada um dos 11 módulos |
| 06 | [Base de Conhecimento](docs/06-Base-de-Conhecimento.md) | A **estrutura de conhecimento**: empresas, competências, frameworks, templates |
| 07 | [Roadmap e Métricas](docs/07-Roadmap-e-Metricas.md) | **Quando** cada capacidade entra e **como** medimos sucesso |

## Como usar este pacote

> **Quer usar o Career OS em um chat novo agora?** O [Guia de Ativação](docs/ATIVACAO.md) tem um prompt único e autocontido, pronto para colar em um Custom GPT, um Projeto ou qualquer chat.

### Caminho A — Career OS como GPT (hoje)
1. Cole o [System Prompt Master](docs/04-System-Prompt-Master.md) na configuração de instruções do GPT.
2. Anexe a [Base de Conhecimento](docs/06-Base-de-Conhecimento.md) e os [Prompts dos Módulos](docs/05-Prompts-Modulos/) como arquivos de conhecimento.
3. Use os prompts especializados como "comandos" que o usuário invoca por módulo.

### Caminho B — Career OS como SaaS/agente (amanhã)
1. Implemente o [Modelo de Dados](docs/03-Modelo-de-Dados.md) como schema de banco.
2. Implemente o [Decision Engine](docs/02-Decision-Engine.md) como serviço de scoring.
3. Use a [Arquitetura Funcional](docs/01-Arquitetura-Funcional.md) como contrato entre serviços, e os prompts dos módulos como definição de cada agente/ferramenta (MCP).

## Os 11 módulos, em uma frase

1. **Career Assessment** — mede senioridade, competências, liderança e empregabilidade.
2. **Executive Search** — encontra vagas altamente aderentes.
3. **Market Intelligence** — mapeia empresas-alvo e o mercado oculto.
4. **ATS Analyzer** — pontua o currículo contra a vaga e o filtro de ATS.
5. **Resume Optimizer** — reescreve o currículo para impacto e aderência.
6. **LinkedIn Optimizer** — transforma o perfil em ativo de atração.
7. **Interview Coach** — prepara para cada etapa da entrevista.
8. **Salary Intelligence** — dá poder de fogo na negociação de proposta.
9. **Networking** — planeja abordagens estratégicas a decisores.
10. **Career CRM** — organiza e mede todas as candidaturas.
11. **Executive Dashboard** — consolida os indicadores da jornada.

Tudo é orquestrado pelo **Career Core** (contexto, memória, decisão e orquestração).

## Princípios de design

- **Consultor, não buscador.** Cada saída é uma recomendação explicável, não uma lista de links.
- **Independente de tecnologia.** Nada aqui presume GPT, banco ou linguagem específica.
- **Explicável e rastreável.** Todo score mostra o porquê; toda informação cita a fonte.
- **Modular e evolutivo.** Um módulo pode nascer, melhorar ou ser substituído sem quebrar o resto.
- **O usuário decide.** O sistema nunca candidata, negocia ou fecha nada em nome do usuário.
