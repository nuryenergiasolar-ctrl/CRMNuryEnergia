# CRM Nury Energia — cópia completa do projeto

Este pacote contém **todo o código** do sistema: telas de Orçamentos (novo,
tabela, pendentes, fechados, arquivados), Comercial/CRM (leads, pipeline/kanban,
vendas, follow-ups, equipe, metas, produtos), Cobranças com calendário,
Configurações, Login, menu lateral, além das 16 migrações que recriam o banco de
dados inteiro (`supabase/migrations`).

Envie esta pasta para um repositório no GitHub normalmente. Nada aqui depende da
Lovable para ser versionado.

---

## O que este pacote NÃO contém (e por quê)

| Item | Motivo | Como obter |
|---|---|---|
| `.env` com as chaves reais | Contém credenciais; nunca vai para o GitHub | Use `.env.example` como modelo |
| Dados cadastrados (orçamentos, leads, cobranças...) | Ficam no banco, não em arquivos | Exportar do banco — ver `MIGRACAO.md` |
| Usuários e senhas do login | Ficam na área de autenticação do banco | Exportar do banco — ver `MIGRACAO.md` |
| PDFs e imagens anexados aos orçamentos | Ficam no armazenamento de arquivos (bucket `anexos`) | Copiar o bucket — ver `MIGRACAO.md` |
| `node_modules` | Reinstalável | `bun install` |

---

## O que ainda depende do Lovable Cloud

### 1. Banco de dados, autenticação e arquivos (Supabase)

Hoje o app aponta para o projeto de banco fornecido pela Lovable. Ele guarda:

- **Dados**: orçamentos e histórico, leads e histórico, follow-ups, cobranças,
  produtos, vendedores, metas, configurações, marketing, integrações e papéis
  de usuário (15 tabelas).
- **Autenticação**: login por e-mail/senha e Google, com papéis
  administrador/vendedor.
- **Arquivos**: bucket privado `anexos` com os PDFs e imagens dos orçamentos.

Para sair, crie um projeto Supabase seu, rode as migrações e importe dados,
usuários e arquivos. Passo a passo com comandos em **`MIGRACAO.md`**.

Ponto de atenção: as regras de acesso usam a função `meu_vendedor()`, que liga o
**e-mail do login** à linha na tabela `vendedores`. Os e-mails precisam
permanecer idênticos após a importação.

### 2. Conselho Operacional (IA)

O botão de conselhos usa a IA da Lovable por padrão. O código já está preparado
para qualquer provedor compatível com a API da OpenAI: basta definir
`AI_API_KEY`, `AI_BASE_URL` e `AI_MODEL` (ver `.env.example`). Sem essas
variáveis e fora da Lovable, apenas esse botão deixa de responder — o resto do
sistema funciona normalmente.

Arquivos envolvidos: `src/lib/ai-gateway.server.ts` e
`src/lib/conselhos.functions.ts`.

### 3. Configuração de build

O `vite.config.ts` usa o pacote `@lovable.dev/vite-tanstack-config`, que apenas
agrupa plugins padrão do Vite (TanStack Start, React, Tailwind, aliases, Nitro).
Ele é instalado pelo npm e continua funcionando fora da Lovable. Se preferir
removê-lo, declare esses plugins manualmente.

### 4. Telemetria de erros

`src/lib/lovable-error-reporting.ts` só envia erros para a Lovable. Pode ser
removido sem qualquer impacto funcional.

### 5. Arquivos gerados automaticamente

`src/integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`,
`auth-attacher.ts` e `types.ts` foram gerados apontando para o projeto atual.
Eles leem as variáveis de ambiente, então funcionam com qualquer projeto — só
regere os tipos no projeto novo:

```bash
supabase gen types typescript --project-id SEU_PROJETO > src/integrations/supabase/types.ts
```

A pasta `.lovable/` contém apenas metadados do editor e pode ser apagada.

---

## Rodando localmente

```bash
bun install
cp .env.example .env   # preencha com as chaves do seu projeto
bun run dev
```

Build de produção: `bun run build` (alvo padrão Cloudflare Workers; Vercel e
Netlify também funcionam ajustando o preset do Nitro).

## Stack

TanStack Start v1 (React 19 + Vite), Tailwind CSS v4, shadcn/ui, TanStack Query,
Supabase JS, Recharts, JSZip, date-fns. Nada proprietário nas telas.
