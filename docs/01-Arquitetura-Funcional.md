# 01 · Arquitetura Funcional — Career OS

Como os módulos se relacionam. Este documento é o **contrato entre partes**: descreve responsabilidades, entradas/saídas e o fluxo de orquestração — sem presumir tecnologia. Serve tanto como estrutura de um GPT quanto como mapa de microsserviços/agentes MCP.

---

## 1. Visão em camadas

```
┌─────────────────────────────────────────────────────────────┐
│  CAMADA DE INTERAÇÃO                                         │
│  Conversa · Comandos por módulo · Dashboard                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  CAREER CORE  (núcleo de orquestração)                      │
│  Contexto · Memória · Decisão · Roteamento · Explicação     │
└───────────────────────────┬─────────────────────────────────┘
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
┌───────────────────────────────────────────────────────────┐
│  CAMADA DE MÓDULOS  (11 capacidades especializadas)        │
│  M1 Assessment   M2 Exec Search   M3 Market Intel          │
│  M4 ATS Analyzer M5 Resume Opt    M6 LinkedIn Opt          │
│  M7 Interview    M8 Salary Intel  M9 Networking            │
│  M10 Career CRM  M11 Dashboard                             │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌───────────────────────────────────────────────────────────┐
│  DECISION ENGINE  (regras e scores compartilhados)         │
│  Match · ATS · GAP · Readiness · Priorização               │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌───────────────────────────────────────────────────────────┐
│  CAMADA DE DADOS  (entidades canônicas)                    │
│  Candidato · Vaga · Empresa · Candidatura · Entrevista ... │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌───────────────────────────────────────────────────────────┐
│  CAMADA DE FONTES  (plugável)                              │
│  LinkedIn · Workday · Greenhouse · Lever · Glassdoor ...   │
└───────────────────────────────────────────────────────────┘
```

**Regra de dependência:** camadas superiores conhecem as inferiores, nunca o contrário. Um módulo nunca chama outro módulo diretamente — a coordenação passa **sempre** pelo Career Core. Isso mantém o sistema modular e substituível.

---

## 2. Career Core (o núcleo)

O Career Core é o "kernel" do sistema operacional. Ele não executa análises de domínio; ele **coordena**.

| Responsabilidade | Descrição |
|------------------|-----------|
| **Contexto** | Mantém o estado atual: objetivo ativo, vaga em foco, etapa da jornada |
| **Memória** | Perfil do candidato, histórico de interações, decisões e resultados |
| **Decisão** | Escolhe qual(is) módulo(s) acionar para o objetivo declarado |
| **Orquestração** | Sequencia módulos, passa contexto entre eles, consolida saídas |
| **Explicação** | Garante que toda saída ao usuário seja explicável e rastreável |

### Contrato de roteamento (intenção → módulos)

| Intenção do usuário | Módulos acionados (em ordem) |
|---------------------|------------------------------|
| "Onde estou na minha carreira?" | M1 |
| "Encontre vagas para mim" | M1 (se sem perfil) → M2 → Decision Engine (Match) |
| "Vale a pena esta vaga?" | M2 (enriquece) → M3 (empresa) → Decision Engine (Match+GAP) |
| "Prepare meu currículo para esta vaga" | M4 (ATS) → M5 (reescrita) |
| "Melhore meu LinkedIn" | M1 → M6 |
| "Vou ser entrevistado, me prepare" | M3 (empresa) → M7 |
| "Recebi uma proposta" | M8 |
| "Como chego ao decisor desta empresa?" | M3 → M9 |
| "Como está minha busca?" | M10 → M11 |
| "Qual meu plano?" | Core sintetiza M1+M11 em plano de ação |

---

## 3. Os 11 módulos — contratos de entrada/saída

Cada módulo é uma **caixa-preta contratual**: recebe entidades canônicas e devolve entidades/insights explicáveis. Isso permite trocar a implementação (prompt, modelo, serviço) sem afetar o resto.

| # | Módulo | Entrada principal | Saída principal | Score que produz |
|---|--------|-------------------|-----------------|------------------|
| M1 | **Career Assessment** | Candidato | Perfil avaliado + gaps de senioridade | Executive Readiness |
| M2 | **Executive Search** | Objetivo + Perfil | Lista de Vagas normalizadas | (usa Match Score) |
| M3 | **Market Intelligence** | Setor/objetivo | Lista de Empresas-alvo + dossiês | Market Competitiveness |
| M4 | **ATS Analyzer** | Currículo + Vaga | Diagnóstico de aderência ao ATS | ATS Score |
| M5 | **Resume Optimizer** | Currículo + Vaga + ATS diag | Currículo reescrito | Resume Score |
| M6 | **LinkedIn Optimizer** | Perfil + objetivo | Recomendações de perfil | LinkedIn Score |
| M7 | **Interview Coach** | Vaga + Empresa + Perfil | Roteiro + simulação por etapa | Interview Readiness |
| M8 | **Salary Intelligence** | Vaga + Proposta + mercado | Análise de proposta + estratégia | (faixa + BATNA) |
| M9 | **Networking** | Empresa + decisores | Plano de abordagem + mensagens | Networking Score |
| M10 | **Career CRM** | Candidaturas | Funil + próximos passos | Conversões do funil |
| M11 | **Executive Dashboard** | Todos os scores | Painel consolidado | (agrega todos) |

Especificação detalhada de cada score em [02-Decision-Engine](02-Decision-Engine.md). Entidades em [03-Modelo-de-Dados](03-Modelo-de-Dados.md).

---

## 4. Fluxo principal (jornada canônica)

```
Usuário define objetivo
        │
        ▼
Career Core carrega contexto + memória (Perfil)
        │
        ▼
Core seleciona módulos (contrato de roteamento)
        │
        ▼
Módulos executam análises  ──►  Decision Engine calcula scores
        │
        ▼
Core consolida em recomendação explicável (o quê + por quê + fonte)
        │
        ▼
Usuário decide e age  ──►  Core atualiza histórico/CRM
        │
        ▼
Dashboard reflete novo estado  ──►  próximo objetivo
```

O ciclo é **iterativo**: cada volta enriquece a memória e melhora as próximas recomendações.

---

## 5. Jornada end-to-end (exemplo integrado)

1. **Diagnóstico** — M1 avalia o candidato → Executive Readiness Score + gaps.
2. **Estratégia** — Core traduz gaps em objetivo (ex.: "migrar de Head para Diretor em varejo").
3. **Descoberta** — M2 busca vagas; M3 mapeia empresas-alvo e mercado oculto.
4. **Priorização** — Decision Engine ranqueia por Match Score; Core apresenta o shortlist explicado.
5. **Preparação de material** — M4 pontua o currículo vs. vaga; M5 reescreve; M6 alinha o LinkedIn.
6. **Ação** — usuário candidata-se; M10 registra no CRM.
7. **Entrevista** — M3 gera dossiê da empresa; M7 prepara por etapa.
8. **Proposta** — M8 analisa a oferta e define estratégia de negociação.
9. **Relacionamento** — M9 sustenta networking com decisores durante todo o processo.
10. **Medição** — M11 mostra conversões e Time to Placement; Core recomenda ajustes de estratégia.

---

## 6. Princípios arquiteturais

- **Núcleo fino, módulos especialistas.** Toda a inteligência de domínio vive nos módulos; o Core só orquestra.
- **Entidades canônicas.** Todos falam a mesma linguagem de dados (ver Modelo de Dados).
- **Fontes plugáveis + degradação graciosa.** Se uma fonte cai, o sistema segue com as demais e sinaliza a limitação.
- **Explicabilidade obrigatória.** Nenhuma saída sem "por quê" e sem fonte.
- **Estado no Core, não nos módulos.** Módulos são, idealmente, sem estado — recebem contexto, devolvem resultado. Isso os torna testáveis e substituíveis.
- **Evolução por substituição.** Trocar um módulo (ex.: novo Interview Coach) não exige mudar nenhum outro.
