# Setup do Projeto no Claude — Career OS

Guia para rodar o Career OS como um **Projeto** no Claude (claude.ai). Tempo: ~3 minutos. Reutiliza os mesmos artefatos do Custom GPT.

---

## 1. Criar o projeto
1. Em **claude.ai**, no menu lateral, clique em **Projects** → **New project** (ou **Create project**).
2. **Nome:** `Career OS`.
3. **Descrição** (opcional): "Consultor estratégico de carreira para líderes — diagnóstico, vagas, currículo/LinkedIn, entrevistas, salário e networking."

## 2. Definir as instruções do projeto
1. Dentro do projeto, abra **Instructions** (ou "Set instructions" / "Custom instructions").
2. **Cole o conteúdo de `Career-OS-Instructions.txt`** (o Prompt de Ativação — está em [`ATIVACAO.md`](ATIVACAO.md)). É o que define identidade, os 11 módulos, as regras de decisão e o comportamento.
3. Salve.

> As instruções do projeto valem para **todas as conversas** dentro dele — todo chat novo já nasce como Career OS, sem recolar nada.

## 3. Adicionar o conhecimento
1. No projeto, use **Add content** / **Project knowledge** (a área de arquivos/texto do projeto).
2. **Descompacte `Career-OS-Knowledge.zip`** e faça upload dos arquivos. Prioridade (mínimo em **negrito**):
   - **`02-Decision-Engine.md`**, **`03-Modelo-de-Dados.md`**, **`04-System-Prompt-Master.md`**, **`06-Base-de-Conhecimento.md`**
   - **Os 11 prompts** `M01`–`M11`
   - `00-PRD.md`, `01-Arquitetura-Funcional.md`, `07-Roadmap-e-Metricas.md` (contexto, opcionais)
3. (Opcional) Adicione também **o seu currículo** e **seu perfil do LinkedIn** como conhecimento do projeto — assim o Career OS já parte do seu contexto real em qualquer conversa.

## 4. Ligar a busca na web (importante)
No Claude, a busca na web é um recurso da conta, não do projeto. Ative-a em **Settings → Feature preview / Tools** (conforme seu plano). Os módulos **Executive Search, Market Intelligence e Salary Intelligence** dependem dela para trazer vagas, empresas e faixas salariais reais **com fonte**. Sem web, esses módulos operam em modo "melhor esforço" e sinalizam a limitação.

## 5. Testar
1. Abra um **chat novo dentro do projeto**.
2. Escreva: **"Faça meu diagnóstico de carreira"**.
3. Ele deve se apresentar em 2–3 linhas e conduzir o Career Assessment com até 5 perguntas objetivas.

Se em conversas longas ele "sair do papel", diga "**continue como Career OS**".

---

## Custom GPT × Projeto no Claude — equivalências

| Custom GPT (ChatGPT) | Projeto (Claude) |
|----------------------|------------------|
| Instructions | Instruções do projeto |
| Knowledge (upload) | Project knowledge (upload) |
| Conversation starters | — (não existe; comece você digitando o pedido) |
| Web Search (toggle no GPT) | Busca na web da conta (Settings) |
| Capabilities (Canvas, Code) | Artifacts / Análise, disponíveis por padrão |

## Manutenção
Ao evoluir os documentos deste repositório, **re-suba** os arquivos atualizados no *Project knowledge* e, se o comportamento mudou, atualize as **instruções do projeto** com o novo Prompt de Ativação.
