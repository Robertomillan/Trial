# 07 · Roadmap e Métricas — Career OS

Quando cada capacidade entra e como medimos que o Career OS está funcionando.

---

## 1. Roadmap por fases

### MVP — provar o núcleo de valor
Objetivo: o usuário consegue percorrer a espinha dorsal da jornada (diagnóstico → descoberta → material → organização → indicadores).

| Módulo | Entrega |
|--------|---------|
| Career Assessment (M1) | Diagnóstico + Executive Readiness Score |
| Executive Search (M2) | Busca aderente + Match Score + shortlist |
| ATS Analyzer (M4) | ATS Score + keywords ausentes |
| Resume Optimizer (M5) | Reescrita + Resume Score |
| LinkedIn Optimizer (M6) | Recomendações + LinkedIn Score |
| Career CRM (M10) | Funil + conversões |
| Executive Dashboard (M11) | Indicadores consolidados |

**Critério de saída do MVP:** um executivo consegue, sozinho, sair do diagnóstico a um shortlist priorizado com currículo e LinkedIn otimizados e candidaturas organizadas com métricas.

### V2 — profundidade estratégica
| Módulo | Entrega |
|--------|---------|
| Interview Coach (M7) | Preparação por etapa + Interview Readiness |
| Salary Intelligence (M8) | Análise de proposta + negociação |
| Networking (M9) | Abordagem a decisores + Networking Score |
| Mercado Oculto (M3 completo) | Empresas-alvo + sinais + oportunidades não anunciadas |

### V3 — automação e continuidade
- Integração com **calendário** (entrevistas, follow-ups).
- Integração com **e-mail** (registro automático de interações no CRM).
- **Alertas automáticos** (follow-ups, prazos, novas vagas aderentes).
- **Monitoramento contínuo** de vagas e sinais de mercado.

---

## 2. Métricas do usuário (KPIs)

### Prontidão (o quão pronto o usuário está) — escala 0–100
| Métrica | Módulo | Meta de referência |
|---------|--------|--------------------|
| Executive Readiness Score | M1/M11 | ≥ 75 antes de aplicar em peso |
| ATS Readiness | M4 | ≥ 70 por vaga-alvo |
| Resume Score | M5 | ≥ 80 |
| LinkedIn Score | M6 | ≥ 75 |
| Interview Readiness | M7 | ≥ 75 antes de cada etapa |
| Networking Score | M9 | crescente ao longo da busca |
| Market Competitiveness | M3 | ≥ 60 para o objetivo |

### Desempenho (o que a jornada produz)
| Métrica | Definição | Direção |
|---------|-----------|---------|
| Application Conversion | candidaturas → triagem | ↑ |
| Interview Rate | candidaturas → entrevistando | ↑ |
| Offer Rate | entrevistas → proposta | ↑ |
| Time to Placement | 1ª candidatura → fechada | ↓ |

> Regra do Dashboard: toda métrica fora da meta vem acompanhada da ação de correção e do módulo responsável.

---

## 3. Métricas de negócio (produto)

| Dimensão | Indicadores |
|----------|-------------|
| Ativação | % de usuários que completam o Assessment e geram 1º shortlist |
| Engajamento | módulos usados por usuário; frequência de retorno |
| Eficácia | melhora média de Interview/Offer Rate vs. baseline do usuário |
| Resultado | Time to Placement médio; taxa de recolocação |
| Retenção/Expansão | uso continuado; caminho para B2B (consultorias, outplacement) |

---

## 4. Métricas de aprendizado (recalibração do Decision Engine)

O Decision Engine nasce com pesos-default. Ele deve **aprender** com resultados reais:

- Correlação entre **Match Score** e avanço real no funil → recalibrar pesos das 5 dimensões.
- Correlação entre **ATS Score** e passagem na triagem → validar componentes.
- Padrões de perda por estágio → ajustar recomendações dos módulos.
- Convergência de fontes salariais vs. propostas reais → melhorar guias salariais.

Cadência sugerida: revisão de calibração a cada janela significativa de dados (ex.: a cada N candidaturas fechadas).

---

## 5. Riscos e mitigação (operacional)

| Risco | Mitigação |
|-------|-----------|
| Dependência de fontes externas | Camada de fontes plugável; múltiplas fontes; degradação graciosa |
| Mudanças em ATS/sites de carreira | Análise por princípios, não por scraping frágil |
| Qualidade variável de descrições | Normalização + flag de confiança |
| Acesso limitado a dados salariais | Triangulação + entrada colaborativa do usuário |
| Expectativa de "garantia de emprego" | Escopo explícito: o sistema potencializa, não garante |

---

## 6. Definição de sucesso (produto)

O Career OS terá cumprido sua promessa quando um executivo puder dizer:

> "Eu sabia exatamente onde estava, para onde ir, quais oportunidades perseguir, com material afiado, entrevistas bem preparadas e uma negociação informada — tudo em um só lugar, e com números mostrando meu progresso."
