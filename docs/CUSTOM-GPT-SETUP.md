# Setup do Custom GPT — Career OS

Guia campo a campo para criar o Career OS como Custom GPT no ChatGPT (requer plano Plus/Team/Enterprise). Tempo: ~5 minutos.

> Onde: ChatGPT → menu lateral → **GPTs** → **Create** → aba **Configure** (use a aba *Configure*, não a *Create* conversacional — é mais rápido e preciso).

---

## 1. Preencha cada campo

### Name
```
Career OS
```

### Description
```
Consultor estratégico de carreira para líderes (Gerente a C-Level): diagnóstico, busca de vagas aderentes, otimização de currículo e LinkedIn, entrevistas, negociação salarial e networking — tudo em um só lugar.
```

### Instructions
Cole aqui o **Prompt de Ativação** completo, que está em [`ATIVACAO.md`](ATIVACAO.md) (bloco "PROMPT DE ATIVAÇÃO"). É ele que define identidade, módulos, regras de decisão e comportamento.

### Conversation starters (sugestões)
```
Faça meu diagnóstico de carreira (Career Assessment)
Busque vagas aderentes ao meu perfil
Analise meu currículo para esta vaga: [cole a descrição da vaga]
Recebi uma proposta — vale a pena e como eu negocio?
```

---

## 2. Knowledge (base de conhecimento)

Faça **upload dos arquivos da pasta `docs/`** deste repositório. Isso dá profundidade aos módulos (fórmulas, entidades, frameworks e os 11 prompts). Recomendados (mínimo em **negrito**):

- **`02-Decision-Engine.md`** — regras de Match/ATS/GAP/Readiness
- **`03-Modelo-de-Dados.md`** — entidades da jornada
- **`04-System-Prompt-Master.md`** — comportamento completo
- **`06-Base-de-Conhecimento.md`** — competências, frameworks, salários
- **Pasta `05-Prompts-Modulos/`** — os 11 prompts operáveis
- `00-PRD.md`, `01-Arquitetura-Funcional.md`, `07-Roadmap-e-Metricas.md` — contexto de produto (opcionais)

> Dica: se preferir subir menos arquivos, os 4 em negrito + a pasta de módulos já cobrem 90% do valor.

---

## 3. Capabilities (recursos)

| Recurso | Recomendação | Por quê |
|---------|--------------|---------|
| **Web Search** | ✅ Ligar | Essencial para Executive Search, Market Intelligence e Salary Intelligence buscarem vagas, empresas e faixas reais — e citarem fontes |
| Canvas | ⬜ Opcional | Útil para editar currículo/LinkedIn lado a lado |
| Code Interpreter & Data Analysis | ⬜ Opcional | Útil se quiser análises/planilhas do funil |
| Image Generation | ⬜ Desligar | Não faz parte do escopo |

---

## 4. Salvar e testar

1. Clique em **Create / Save** → escolha a visibilidade (**Only me** é o suficiente).
2. Abra o GPT e clique em **"Faça meu diagnóstico de carreira"**.
3. Ele deve se apresentar em 2–3 linhas e conduzir o Career Assessment com até 5 perguntas objetivas.

Se ele "esquecer" o papel em conversas longas, basta dizer "**continue como Career OS**" — o comportamento volta.

---

## 5. Manutenção

- Ao evoluir os documentos deste repo, **re-suba** os arquivos atualizados em *Knowledge* e, se mudou o comportamento, atualize as *Instructions* com o novo Prompt de Ativação.
- Versione mudanças relevantes aqui no repositório para manter GPT e documentação em sincronia.
