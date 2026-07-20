# 06 · Base de Conhecimento — Career OS

A estrutura de conhecimento que alimenta os módulos. Enquanto o Modelo de Dados descreve os dados **do usuário**, a Base de Conhecimento descreve o conhecimento **do domínio** — reutilizável entre todos os usuários. Num GPT, vira arquivos de conhecimento; num SaaS, vira tabelas de referência e catálogos versionados.

---

## 1. Catálogo de Competências

Dicionário canônico de competências executivas, com sinônimos (para o match semântico do Decision Engine) e categoria.

Estrutura de cada item:
```
competencia:
  nome: "Gestão de P&L"
  categoria: liderança        # técnica | funcional | liderança | comportamental
  sinonimos: ["responsabilidade por resultado", "gestão de resultado", "ownership de P&L"]
  niveis: [básico, intermediário, avançado, referência]
  evidencias_tipicas: ["tamanho de P&L gerido", "turnaround", "crescimento de receita"]
```

Blocos mínimos do catálogo:
- **Liderança & Gestão:** P&L, gestão de times, gestão de mudança, cultura, board management.
- **Funcionais por área:** Comercial/Vendas, Marketing, Operações, Finanças, Tecnologia/Produto, RH, Supply Chain, Jurídico.
- **Estratégicas:** estratégia, M&A, expansão/internacionalização, transformação digital, turnaround.
- **Comportamentais:** comunicação executiva, influência, resiliência, pensamento crítico.

---

## 2. Framework de Senioridade

Referência para calibrar nível por **escopo**, não por título (usado pelo M1).

| Nível | Escopo típico | Horizonte de decisão |
|-------|---------------|----------------------|
| Gerente | time/função, entrega operacional | trimestral |
| Head | área, múltiplos times, metas de área | anual |
| Diretor | função completa / unidade, P&L parcial | 1–2 anos |
| VP | múltiplas áreas, P&L relevante | 2–3 anos |
| C-Level | empresa/BU, P&L total, estratégia | 3–5 anos |
| Conselheiro/Board | governança, supervisão | plurianual |
| Interim/Advisory | mandato específico, tempo definido | do mandato |

---

## 3. Frameworks de Análise

Frameworks que os módulos aplicam. Documentados para consistência e explicabilidade.

- **Match Score** (M2/DE) — 5 dimensões ponderadas (competências, senioridade, setor, requisitos, objetivo).
- **ATS Score** (M4/DE) — keywords, parseabilidade, título, quantificação, estrutura.
- **GAP Analysis** (DE) — tipo × severidade × endereçável → prioridade.
- **STAR** (M7) — Situação · Tarefa · Ação · Resultado, para respostas de entrevista.
- **Bullet de impacto** (M5/M6) — Ação → Contexto → Resultado quantificado.
- **BATNA / Zona de Acordo** (M8) — melhor alternativa e faixa de negociação.
- **Opportunity Score** (DE) — priorização do shortlist.

---

## 4. Templates

Modelos reutilizáveis que os módulos preenchem com dados do usuário.

| Template | Módulo | Conteúdo |
|----------|--------|----------|
| Currículo executivo | M5 | estrutura de uma coluna, ATS-friendly, seções padrão |
| Headline + "Sobre" LinkedIn | M6 | fórmulas de posicionamento |
| Bullet de impacto | M5/M6 | Ação–Contexto–Resultado |
| Respostas STAR | M7 | esqueleto por tipo de pergunta |
| Mensagem de networking | M9 | primeiro contato, follow-up, nutrição |
| Roteiro de negociação | M8 | ancoragem, contraproposta, trade-offs |
| Dossiê de empresa | M3 | modelo de negócio, momento, decisores, cultura |
| Plano de candidatura | Core | objetivo, ações, prazos por oportunidade |

---

## 5. Estrutura de Empresas & Mercado (Market Intelligence)

Base para o M3 organizar inteligência de mercado.

- **Setores** — taxonomia de setores e adjacências (para match de setor no Match Score).
- **Sinais de contratação** — catálogo de gatilhos de demanda: rodada de investimento, expansão geográfica, novo produto/BU, troca de liderança, crescimento acelerado, reestruturação, M&A.
- **Mapa de canais de vaga** — como cada fonte funciona: LinkedIn, Workday, Greenhouse, Lever, Indeed, Glassdoor, sites corporativos.
- **Consultorias de Executive Search** — Michael Page, Robert Half, Page Executive, Korn Ferry (e como cada uma opera por senioridade/setor).

---

## 6. Guias Salariais

Base para o M8 triangular remuneração.

Estrutura por referência:
```
referencia_salarial:
  cargo: "Diretor de Operações"
  setor: "Varejo"
  porte: "grande"
  geografia: "Brasil - SP"
  faixa: { fixo: [min, max], variavel_%: [min, max], lti: descrição }
  fontes: ["...", "..."]
  atualizado_em: data
  confianca: alta | média | baixa
```

Princípio: sempre ≥2 fontes por referência; confiança proporcional à convergência das fontes. Complementável pela entrada colaborativa do usuário.

---

## 7. Governança do conhecimento

- **Versionamento:** cada bloco da KB tem data de atualização e fonte.
- **Rastreabilidade:** conhecimento usado em recomendação deve ser citável.
- **Separação usuário × domínio:** dados pessoais (Modelo de Dados) nunca se misturam ao conhecimento de domínio (esta KB).
- **Evolução:** a KB cresce com o produto; os *pesos* do Decision Engine devem ser recalibrados com dados reais de conversão (ver Roadmap).
