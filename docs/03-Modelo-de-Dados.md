# 03 · Modelo de Dados — Career OS

As **entidades canônicas** do sistema. Este é o vocabulário compartilhado por todos os módulos, pelo Decision Engine e pela camada de persistência. É independente de banco: serve como schema conceitual para SQL, NoSQL, ou como estrutura de "conhecimento" de um GPT.

**Convenções:** `id` = identificador único · `PK`/`FK` = chave primária/estrangeira · tipos são conceituais (`texto`, `número`, `data`, `enum`, `lista<T>`, `objeto`).

---

## 1. Mapa de entidades (relacionamentos)

```
Candidato ─1──N─ Experiencia
    │ 1
    ├───N─ Competencia (via CandidatoCompetencia)
    │ 1
    ├───N─ Objetivo
    │ 1
    ├───N─ Documento (Currículo / versão)
    │ 1
    └───N─ Candidatura ─N──1─ Vaga ─N──1─ Empresa
                │ 1                          │ 1
                ├───N─ Entrevista            └───N─ Decisor (Contato)
                │ 1
                ├───N─ Interacao (CRM)
                │ 0..1
                └────── Proposta

Empresa ─1──N─ Decisor
Candidato ─1──N─ RelacionamentoNetworking ─N──1─ Decisor
Candidato ─1──N─ ScoreSnapshot   (histórico de indicadores)
```

---

## 2. Entidades

### Candidato
O usuário. Núcleo da memória do Career Core.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | PK | |
| nome | texto | |
| headline | texto | posicionamento em uma linha |
| senioridade | enum | Gerente, Head, Diretor, VP, C-Level, Conselheiro, Consultor, Interim |
| anos_experiencia | número | |
| localizacao | texto | |
| mobilidade | enum | fixo, nacional, internacional, remoto |
| idiomas | lista<objeto{idioma, nivel}> | |
| resumo_profissional | texto | |
| setores | lista<texto> | setores de atuação |
| preferencias | objeto | remuneração-alvo, tipo de empresa, cultura, deal-breakers |
| privacidade | enum | confidencial por padrão |
| criado_em / atualizado_em | data | |

### Experiencia
Cada passagem profissional do candidato.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | PK | |
| candidato_id | FK → Candidato | |
| empresa | texto | |
| cargo | texto | |
| senioridade | enum | |
| inicio / fim | data | fim nulo = atual |
| escopo | objeto | tamanho de time, P&L, região, orçamento |
| realizacoes | lista<objeto{descricao, metrica, resultado}> | base para bullets quantificados |
| setor | texto | |

### Competencia
Dicionário canônico de competências (ver Base de Conhecimento).

| Campo | Tipo | Notas |
|-------|------|-------|
| id | PK | |
| nome | texto | |
| categoria | enum | técnica, funcional, liderança, comportamental |
| sinonimos | lista<texto> | usado no match semântico de skills |

### CandidatoCompetencia (associação)
| Campo | Tipo | Notas |
|-------|------|-------|
| candidato_id | FK | |
| competencia_id | FK | |
| nivel | enum | básico, intermediário, avançado, referência |
| evidenciada | booleano | há prova na trajetória? |

### Objetivo
O que o candidato busca. Direciona o roteamento do Core.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | PK | |
| candidato_id | FK | |
| descricao | texto | ex.: "migrar de Head para Diretor em varejo" |
| tipo | enum | recolocação, ascensão, advisory/board, interim, exploração |
| cargo_alvo | texto | |
| setores_alvo | lista<texto> | |
| remuneracao_alvo | objeto | faixa desejada |
| prazo | enum | urgente, 3–6m, exploratório |
| status | enum | ativo, pausado, atingido |

### Documento (Currículo e versões)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | PK | |
| candidato_id | FK | |
| tipo | enum | currículo, carta, bio, perfil-linkedin |
| versao | texto | versões adaptadas por vaga |
| conteudo | texto | |
| vaga_id | FK → Vaga (nulo) | se adaptado para uma vaga específica |
| ats_score | número | último ATS Score deste documento |
| resume_score | número | |

### Empresa
Alvo de contratação; base do Market Intelligence.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | PK | |
| nome | texto | |
| setor | texto | |
| porte | enum | startup, scale-up, média, grande, multinacional |
| localizacao | texto | |
| descricao | texto | dossiê |
| sinais_contratacao | lista<objeto{sinal, data, fonte}> | crescimento, rodada, expansão, saída de exec |
| cultura | texto | |
| fonte | lista<texto> | rastreabilidade |
| status_alvo | enum | alvo, em-contato, em-processo, descartada |

### Decisor (Contato)
Pessoas relevantes numa empresa (hiring manager, RH, board, recrutador).

| Campo | Tipo | Notas |
|-------|------|-------|
| id | PK | |
| empresa_id | FK | |
| nome | texto | |
| cargo | texto | |
| papel | enum | hiring-manager, rh, recrutador, decisor, influenciador, referência |
| canal | objeto | linkedin, email (se conhecido) |
| grau_conexao | enum | frio, 2º grau, 1º grau, relacionamento ativo |

### Vaga
Oportunidade (publicada ou de mercado oculto).

| Campo | Tipo | Notas |
|-------|------|-------|
| id | PK | |
| empresa_id | FK | |
| titulo | texto | |
| senioridade | enum | |
| descricao | texto | normalizada |
| requisitos | lista<objeto{requisito, eliminatorio: booleano}> | |
| competencias_exigidas | lista<FK → Competencia> | |
| localizacao / modelo | texto / enum | presencial, híbrido, remoto |
| remuneracao | objeto (nulo) | se disponível |
| fonte | enum | LinkedIn, Workday, Greenhouse, Lever, Indeed, Glassdoor, site, consultoria, mercado-oculto |
| url | texto | |
| confianca_dados | enum | alta, média, baixa |
| match_score | número | último cálculo para o candidato |
| capturada_em | data | |

### Candidatura
A entidade central do CRM — liga Candidato ↔ Vaga e carrega o funil.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | PK | |
| candidato_id | FK | |
| vaga_id | FK | |
| documento_id | FK → Documento | versão de currículo usada |
| estagio | enum | ver Máquina de Estados abaixo |
| data_aplicacao | data | |
| match_score | número | congelado no momento da candidatura |
| prioridade | enum | alta, média, baixa |
| proximo_passo | objeto{acao, prazo} | |
| notas | texto | |

### Entrevista
| Campo | Tipo | Notas |
|-------|------|-------|
| id | PK | |
| candidatura_id | FK | |
| etapa | enum | triagem-rh, hiring-manager, painel, case, executiva, final |
| data | data | |
| formato | enum | telefone, vídeo, presencial |
| interlocutores | lista<FK → Decisor> | |
| preparo | objeto | roteiro do Interview Coach, perguntas provaveis |
| resultado | enum | pendente, avançou, standby, reprovado |
| feedback | texto | |

### Proposta
| Campo | Tipo | Notas |
|-------|------|-------|
| id | PK | |
| candidatura_id | FK | |
| remuneracao_fixa / variavel / lti | número | salário, bônus, incentivo de longo prazo |
| beneficios | lista<texto> | |
| analise | objeto | faixa de mercado, gap vs. alvo, BATNA (do M8) |
| estrategia_negociacao | texto | |
| status | enum | recebida, em-negociação, aceita, recusada |

### Interacao (evento do CRM)
Timeline de tudo que acontece numa candidatura/relacionamento.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | PK | |
| candidatura_id | FK (nulo) | |
| decisor_id | FK (nulo) | |
| tipo | enum | aplicação, mensagem, resposta, entrevista, follow-up, oferta, nota |
| data | data | |
| conteudo | texto | |

### RelacionamentoNetworking
| Campo | Tipo | Notas |
|-------|------|-------|
| id | PK | |
| candidato_id | FK | |
| decisor_id | FK | |
| objetivo | texto | por que este contato importa |
| status | enum | alvo, abordado, respondeu, em-relacionamento, referência-dada |
| cadencia | objeto | último toque, próximo toque sugerido |

### ScoreSnapshot
Histórico de indicadores para o Dashboard e para medir evolução.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | PK | |
| candidato_id | FK | |
| data | data | |
| scores | objeto | todos os Readiness + conversões do funil |

---

## 3. Máquina de estados da Candidatura

O funil do Career CRM. As transições alimentam as métricas de conversão do Decision Engine.

```
identificada ──► preparando ──► candidatada ──► triagem
                                   │              │
                                   │              ▼
                                   │          entrevistando ──► proposta ──► fechada
                                   │              │                │
                                   ▼              ▼                ▼
                               descartada     reprovada         recusada
```

| Estágio | Significado | Métrica derivada |
|---------|-------------|------------------|
| identificada | vaga no radar, ainda não aplicada | — |
| preparando | ajustando currículo/estratégia | — |
| candidatada | aplicação enviada | denominador de Application Conversion |
| triagem | RH avaliando | — |
| entrevistando | ≥1 entrevista agendada/feita | numerador de **Interview Rate** |
| proposta | oferta recebida | numerador de **Offer Rate** |
| fechada | aceita → recolocação | fecha **Time to Placement** |
| descartada / reprovada / recusada | estados terminais negativos | análise de perda |

---

## 4. Notas de implementação

- **Match Score é congelado** na Candidatura (auditoria) e **vivo** na Vaga (recálculo).
- **Competencia** é dicionário global compartilhado — habilita match semântico e comparabilidade entre candidatos (relevante para o produto B2B futuro).
- **ScoreSnapshot** viabiliza gráficos de evolução no Dashboard sem recalcular histórico.
- **Privacidade:** dados de Candidato e Candidatura são sensíveis; o modelo assume confidencialidade e minimização de dados por padrão.
