# 02 · Decision Engine Specification — Career OS

As **regras de decisão** do sistema. Este é o cérebro analítico compartilhado: define como o Career OS pontua, compara, prioriza e recomenda. Toda regra aqui é **explicável** (o usuário sempre vê o porquê) e **rastreável** (cita a fonte).

> Os pesos e faixas abaixo são **defaults calibráveis**, não verdades absolutas. São o ponto de partida para o MVP e devem ser ajustados com dados reais.

---

## 1. Escala e princípios comuns

- Todos os scores usam a escala **0–100**.
- Faixas qualitativas padrão: **0–39 Baixo · 40–59 Médio · 60–79 Bom · 80–100 Forte**.
- Todo score retorna **4 elementos**: `valor`, `faixa`, `drivers` (o que puxou para cima/baixo), `fonte`.
- Quando faltam dados, o score retorna com **flag de confiança** (`alta/média/baixa`) em vez de inventar precisão.

Formato canônico de saída de qualquer score:
```json
{
  "score": 72,
  "faixa": "Bom",
  "confianca": "media",
  "drivers_positivos": ["...", "..."],
  "drivers_negativos": ["...", "..."],
  "recomendacao": "...",
  "fontes": ["..."]
}
```

---

## 2. Match Score — aderência Perfil × Vaga

**Pergunta que responde:** "Quão aderente esta vaga é a mim?"

Composto por 5 dimensões ponderadas:

| Dimensão | Peso | O que mede |
|----------|------|------------|
| **Competências técnicas / funcionais** | 30% | Skills exigidas presentes no perfil |
| **Senioridade / escopo** | 25% | Nível hierárquico, tamanho de time/P&L compatíveis |
| **Setor / domínio** | 15% | Experiência no setor da vaga (ou adjacente) |
| **Requisitos formais** | 15% | Formação, idiomas, localização, certificações |
| **Aderência ao objetivo do usuário** | 15% | A vaga move o usuário na direção que ele declarou |

**Fórmula:**
```
MatchScore = 0.30·Skills + 0.25·Senioridade + 0.15·Setor + 0.15·Formais + 0.15·Objetivo
```
Cada sub-score 0–100.

**Regras de guarda:**
- Se um **requisito eliminatório** (ex.: idioma obrigatório ausente, exigência de mudança de país recusada) não é atendido → Match teto de **59** e flag explícita.
- Skills são casadas por **equivalência semântica**, não match literal ("liderança de P&L" ≈ "responsabilidade por resultado").
- Experiência de setor **adjacente** conta como parcial (50–70% do peso), não zero.

**Interpretação recomendada ao usuário:**
- 80–100: candidatura prioritária, alta aderência.
- 60–79: candidatura válida; ver GAP para reforçar pontos fracos.
- 40–59: só com narrativa de transição forte + networking.
- 0–39: fora do alvo agora; registrar como aspiracional.

---

## 3. ATS Score — probabilidade de passar no filtro automático

**Pergunta:** "Meu currículo passa pelo ATS desta vaga?"

| Dimensão | Peso | O que mede |
|----------|------|------------|
| **Cobertura de palavras-chave** | 40% | Termos e skills da vaga presentes no currículo |
| **Parseabilidade** | 25% | Formato lê-máquina (sem tabelas quebradas, colunas, imagens de texto) |
| **Aderência de título/senioridade** | 15% | Job title do currículo alinhado ao da vaga |
| **Evidência quantificada** | 10% | Resultados com números (ATS + recrutador valorizam) |
| **Higiene estrutural** | 10% | Seções padrão, datas, contato legíveis |

**Fórmula:**
```
ATSScore = 0.40·Keywords + 0.25·Parse + 0.15·Titulo + 0.10·Quant + 0.10·Estrutura
```

**Regras:**
- Keywords ausentes são listadas explicitamente (input direto para o Resume Optimizer).
- Nunca recomenda **keyword stuffing**: densidade natural; termos só entram se verdadeiros para o candidato.
- Parseabilidade < 60 vira alerta de topo ("seu formato pode ser rejeitado antes de qualquer leitura humana").

---

## 4. GAP Analysis — o que falta para a vaga desejada

**Pergunta:** "O que me separa desta vaga / do próximo nível?"

Produz uma lista priorizada de gaps, cada um classificado:

| Campo | Valores |
|-------|---------|
| `tipo` | competência · experiência · formal · exposição/senioridade · narrativa |
| `severidade` | eliminatório · alto · médio · baixo |
| `endereçável` | rápido (dias) · médio (semanas) · estrutural (meses+) |
| `ação` | recomendação concreta para fechar o gap |

**Regra de priorização de gaps:**
```
Prioridade = severidade × (1 / custo_de_endereçamento)
```
→ Gaps **eliminatórios e rápidos** primeiro; **estruturais e de baixa severidade** por último.

Distingue explicitamente:
- **Gap real** (falta a competência) → desenvolver ou não aplicar.
- **Gap de apresentação** (tem, mas não está no currículo/LinkedIn) → resolver com M5/M6 imediatamente.

---

## 5. Readiness Scores — quão pronto o usuário está

Scores de **prontidão** por frente. Todos 0–100, mesma escala.

| Score | Produzido por | Componentes principais |
|-------|---------------|------------------------|
| **Executive Readiness** | M1 | Clareza de objetivo, força do posicionamento, aderência ao mercado-alvo, prontidão de material |
| **ATS Readiness** | M4 | Média dos ATS Scores das vagas-alvo ativas |
| **Interview Readiness** | M7 | Domínio de narrativa (STAR), preparo por etapa, conhecimento da empresa |
| **LinkedIn Score** | M6 | Headline, sobre, experiência, palavras-chave, prova social, atividade |
| **Resume Score** | M5 | Impacto, quantificação, clareza, aderência, ATS |
| **Networking Score** | M9 | Cobertura de decisores-alvo, qualidade das conexões, cadência de relacionamento |
| **Market Competitiveness** | M3 | Posição do perfil vs. demanda de mercado para o objetivo |

### Executive Readiness Score (índice-topo)
Média ponderada dos demais, é o "north star" pessoal do usuário:
```
ExecReadiness = 0.20·Resume + 0.15·LinkedIn + 0.15·ATS
              + 0.20·Interview + 0.15·Networking + 0.15·MarketCompetitiveness
```

---

## 6. Priorização de oportunidades (ranking do shortlist)

Quando M2 devolve N vagas, o Decision Engine as ordena por um **Opportunity Score** que equilibra aderência e atratividade:

```
OpportunityScore = 0.55·MatchScore
                 + 0.20·AtratividadeDaVaga   (senioridade, empresa, remuneração vs. objetivo)
                 + 0.15·Probabilidade         (Match + presença de networking + timing)
                 + 0.10·EsforçoInverso        (quão pronto o material já está para esta vaga)
```

Saída: shortlist ordenado, cada item com **1 linha de porquê** e o **próximo passo sugerido**.

---

## 7. Comparação de vagas (UC03)

Para comparar duas ou mais vagas, o engine gera uma **matriz de decisão**:

| Critério | Peso (definido/confirmado pelo usuário) | Vaga A | Vaga B |
|----------|------------------------------------------|--------|--------|
| Match Score | — | — | — |
| Remuneração vs. alvo | — | — | — |
| Crescimento / escopo | — | — | — |
| Risco (empresa, setor, estabilidade) | — | — | — |
| Aderência ao objetivo de longo prazo | — | — | — |

Regra: os **pesos são do usuário**, não do sistema. O engine calcula, mas explicita o trade-off e **recomenda sem decidir**.

---

## 8. Salary / Negociação (apoio ao M8)

- **Faixa de referência** por triangulação de ≥2 fontes; sinaliza confiança conforme convergência.
- **BATNA**: força relativa do candidato = f(nº de processos ativos, Match Scores, escassez da skill).
- **Zona de acordo**: piso (walk-away do usuário) × teto plausível (mercado + valor entregue).
- Nunca recomenda um número único: sempre **faixa + justificativa + roteiro de conversa**.

---

## 9. Regras transversais de comportamento

1. **Explicabilidade primeiro.** Nenhum número sem drivers.
2. **Rastreabilidade.** Toda afirmação de mercado/empresa/salário cita fonte; sem fonte → declarar como estimativa.
3. **Confiança honesta.** Dados fracos → confiança baixa explícita, não falsa precisão.
4. **Sem viés de otimismo.** O engine não infla scores para agradar; a utilidade vem da honestidade.
5. **Usuário no controle.** O engine recomenda e prioriza; **decidir, candidatar e negociar é do usuário**.
6. **Recalibrável.** Todos os pesos são parâmetros; devem ser ajustados quando houver dados de conversão reais (ver Roadmap → métricas de aprendizado).
