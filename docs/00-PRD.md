# 00 · Product Requirements Document — Career OS

**Versão:** 1.1 (evolução estruturada da v1.0)
**Autor:** Roberto Millan Pereira de Brito
**Status:** Draft
**Última atualização:** Julho/2026
**Princípio-mestre:** este documento é **independente de tecnologia**. Nada aqui presume GPT, SaaS, app ou agente — todos são caminhos de implementação válidos.

---

## 1. Visão do Produto

### Objetivo
Career OS é um **sistema operacional de carreira** para profissionais de média e alta liderança. Ele combina Executive Search, Inteligência de Mercado, ATS Optimization, Planejamento de Carreira, CRM de Candidaturas e IA para **aumentar a probabilidade de recolocação profissional**.

Diferentemente dos buscadores tradicionais de vagas, o Career OS atua como um **consultor estratégico**, acompanhando toda a jornada do candidato — do diagnóstico à assinatura da proposta.

### Statement de posicionamento
> Para **executivos e líderes em transição de carreira** que precisam se recolocar com rapidez e qualidade, o **Career OS** é um sistema operacional de carreira que **orquestra toda a jornada de recolocação em um só lugar**. Diferentemente de portais de vagas e ATSs, ele **age como consultor**: analisa, recomenda, prepara e mede — sempre com o usuário no controle da decisão.

---

## 2. Problema

O profissional executivo enfrenta hoje uma jornada fragmentada e de baixo retorno:

| Dor | Consequência |
|-----|--------------|
| Vagas espalhadas em dezenas de plataformas | Esforço alto, cobertura baixa |
| Dificuldade de identificar oportunidades aderentes | Candidaturas desperdiçadas |
| Baixa taxa de retorno das candidaturas | Frustração e perda de tempo |
| Currículos genéricos | Filtrados por ATS antes de humanos |
| LinkedIn pouco otimizado | Baixa atração de recrutadores |
| Ausência de acompanhamento estruturado | Perda de follow-ups e prazos |
| Pouca inteligência sobre empresas e mercado | Decisões sem contexto |
| Falta de estratégia integrada | Ações táticas isoladas, sem plano |

**Insight central:** o gargalo não é falta de vagas — é falta de **estratégia integrada, inteligência e disciplina de processo**. É exatamente o que uma consultoria de Executive Search oferece, e o que o mercado de massa não entrega ao indivíduo.

---

## 3. Solução

Criar um sistema operacional que **centralize e orquestre todas as etapas da recolocação**, com um núcleo inteligente (Career Core) coordenando 11 módulos especializados, cada um resolvendo uma etapa da jornada e todos compartilhando o mesmo contexto do candidato.

---

## 4. Público-alvo

### Primário (o usuário que paga e usa)
Executivos · Gerentes · Heads · Diretores · VPs · C-Level · Conselheiros · Consultores · Interim Managers.

### Secundário (usuário profissional / B2B futuro)
Recrutadores · Consultorias de Executive Search · Empresas de Outplacement · Career Coaches · RH Estratégico.

---

## 5. Personas

| Persona | Perfil | Objetivo dominante | Módulos mais usados |
|---------|--------|--------------------|---------------------|
| **P1 — Executivo em recolocação** | 20+ anos, alta liderança, busca posições estratégicas | Recolocar-se rápido e bem, sem se expor no mercado | Executive Search, Market Intelligence, Networking, Salary |
| **P2 — Gerente em ascensão** | Quer migrar para Head/Diretor | Dar o próximo salto de senioridade | Assessment, Resume, LinkedIn, Interview |
| **P3 — Consultor independente** | Busca Advisory, Board e Interim | Construir pipeline de mandatos e posições de conselho | Market Intelligence, Networking, LinkedIn |

---

## 6. Casos de Uso

| ID | Caso de uso | Módulo responsável |
|----|-------------|--------------------|
| UC01 | Buscar vagas aderentes | Executive Search |
| UC02 | Encontrar empresas-alvo | Market Intelligence |
| UC03 | Comparar duas vagas | Executive Search + Decision Engine |
| UC04 | Adaptar currículo para uma vaga | ATS Analyzer + Resume Optimizer |
| UC05 | Preparar entrevista | Interview Coach |
| UC06 | Gerenciar candidaturas | Career CRM |
| UC07 | Analisar proposta salarial | Salary Intelligence |
| UC08 | Gerar plano de ação | Career Core |

---

## 7. Objetivos

### Objetivos do produto (para o usuário)
Descobrir vagas altamente aderentes · identificar empresas com potencial de contratação · melhorar continuamente currículo e LinkedIn · acompanhar candidaturas · preparar entrevistas · negociar propostas · desenvolver networking estratégico.

### Objetivos de negócio
Aumentar: empregabilidade · taxa de entrevistas · taxa de propostas · velocidade de recolocação · qualidade das oportunidades.

---

## 8. Escopo

### Dentro do escopo (MVP)
Career Assessment · Executive Search · ATS Analyzer · Resume Optimizer · LinkedIn Optimizer · Career CRM · Executive Dashboard.

### Fora do escopo (MVP)
O sistema **NÃO** irá:
- enviar candidaturas automaticamente;
- substituir plataformas de ATS;
- negociar em nome do usuário;
- **garantir** contratação.

> Esses limites são intencionais: o Career OS potencializa a decisão humana, não a substitui. Isso reduz risco legal, reputacional e de confiança.

---

## 9. Funcionalidades

| ID | Funcionalidade | Descrição |
|----|----------------|-----------|
| F001 | Cadastro do perfil executivo | Captura estruturada de trajetória, competências e objetivos |
| F002 | Perfil reutilizável | O perfil alimenta todos os módulos sem recadastro |
| F003 | Busca inteligente de vagas | Descoberta aderente ao perfil e objetivos |
| F004 | Pesquisa de mercado oculto | Empresas/oportunidades não anunciadas |
| F005 | Análise de empresas | Inteligência sobre alvos de contratação |
| F006 | Match Score | Aderência explicável perfil × vaga |
| F007 | ATS Score | Probabilidade de passar em filtros automáticos |
| F008 | Gap Analysis | O que falta para a vaga desejada |
| F009 | Plano de candidatura | Roteiro de ação por oportunidade |
| F010 | Preparação para entrevistas | Simulação e roteiros por etapa |
| F011 | Career CRM | Gestão do funil de candidaturas |
| F012 | Dashboard | Indicadores consolidados da jornada |

---

## 10. Indicadores (KPIs do usuário)

Divididos em **prontidão** (o quão pronto o usuário está) e **desempenho** (o que a jornada está produzindo). Definições e fórmulas em [02-Decision-Engine](02-Decision-Engine.md) e [07-Roadmap-e-Metricas](07-Roadmap-e-Metricas.md).

**Prontidão:** Executive Readiness Score · ATS Readiness · Interview Readiness · Networking Score · LinkedIn Score · Resume Score · Market Competitiveness.

**Desempenho:** Application Conversion · Interview Rate · Offer Rate · Time to Placement.

---

## 11. Fontes de dados

LinkedIn · Workday · Greenhouse · Lever · Indeed · Glassdoor · sites corporativos · e consultorias de Executive Search (Michael Page, Robert Half, Page Executive, Korn Ferry).

> Toda fonte usada em uma recomendação deve ser **rastreável** (ver Requisitos Não Funcionais).

---

## 12. Requisitos Não Funcionais

| Requisito | Alvo |
|-----------|------|
| Tempo de resposta (pesquisas simples) | < 30 segundos |
| Arquitetura | Modular, escalável, extensível |
| Explicabilidade | Toda recomendação mostra o "porquê" |
| Rastreabilidade | Toda informação cita a fonte |
| Privacidade | Dados de carreira são sensíveis; confidencialidade por padrão |

---

## 13. Critérios de Sucesso

O usuário consegue: ✔ encontrar vagas relevantes · ✔ melhorar currículo · ✔ melhorar LinkedIn · ✔ identificar empresas · ✔ organizar candidaturas · ✔ preparar entrevistas · ✔ acompanhar indicadores.

---

## 14. Roadmap (resumo)

- **MVP:** Assessment · Executive Search · ATS · Resume · LinkedIn · CRM · Dashboard.
- **V2:** Interview Coach · Salary Intelligence · Networking · Mercado Oculto.
- **V3:** Integração com calendário e e-mail · Alertas automáticos · Monitoramento contínuo de vagas.

Detalhamento em [07-Roadmap-e-Metricas](07-Roadmap-e-Metricas.md).

---

## 15. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Dependência de fontes externas para vagas/dados | Camada de fontes plugável; degradação graciosa; múltiplas fontes por consulta |
| Mudanças frequentes em ATS e sites de carreiras | Análise baseada em princípios de ATS, não em scraping frágil |
| Qualidade variável das descrições de vagas | Normalização e sinalização de baixa confiança ao usuário |
| Acesso limitado a dados salariais/recrutadores | Faixas por triangulação de fontes + entrada colaborativa do usuário |

---

## 16. Diferenciais competitivos

- Visão **integrada** da jornada de recolocação.
- Inteligência de mercado **além das vagas publicadas** (mercado oculto).
- Análises **explicáveis** (Match Score, GAP, ATS).
- **CRM de candidaturas** com métricas.
- Arquitetura **modular** que permite evolução contínua.
- Foco em profissionais de **média e alta liderança**.
