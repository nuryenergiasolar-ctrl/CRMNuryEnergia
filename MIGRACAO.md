# Migração do CRM Nury Energia para fora da Lovable

Guia prático para rodar este sistema no seu próprio ambiente, sem perder dados nem funcionalidades.

## 1. Código

Conecte o projeto ao GitHub pelo menu **+** do chat → **GitHub**. Isso leva todo o
código e a pasta `supabase/migrations` (16 arquivos que recriam o banco inteiro).

## 2. Criar seu projeto de banco/autenticação

Crie um projeto no Supabase (conta sua). Ele fornece banco de dados, login e
armazenamento de arquivos.

## 3. Recriar a estrutura do banco

Rode as migrações em ordem no projeto novo:

```bash
supabase link --project-ref SEU_PROJETO
supabase db push
```

Isso recria tabelas, regras de acesso (RLS), gatilhos de histórico e a numeração
automática `ORC-AAAA-0000`.

## 4. Copiar os dados

No projeto antigo:

```bash
pg_dump "$URL_ANTIGA" --data-only --schema=public > dados.sql
```

No projeto novo:

```bash
psql "$URL_NOVA" -f dados.sql
```

Mantenha os identificadores originais para não quebrar as ligações entre
orçamento, histórico e cobranças.

## 5. Copiar usuários e papéis

```bash
pg_dump "$URL_ANTIGA" --data-only --schema=auth --table=auth.users > usuarios.sql
psql "$URL_NOVA" -f usuarios.sql
```

Os e-mails devem permanecer idênticos: é o e-mail do login que liga o usuário à
linha em `vendedores` (função `meu_vendedor()`). Reative o login com Google
criando credenciais próprias no Google Cloud.

## 6. Copiar os anexos

Crie o bucket `anexos` como **privado**, aplique as mesmas políticas de
`storage.objects` presentes nas migrações e copie os arquivos mantendo os mesmos
caminhos:

```bash
supabase storage cp -r ss://anexos ss://anexos --experimental
```

## 7. Variáveis de ambiente

Copie `.env.example` para `.env` e preencha. Para o Conselho Operacional de IA,
defina `AI_API_KEY`, `AI_BASE_URL` e `AI_MODEL` de qualquer provedor compatível
com a API da OpenAI. A chave da Lovable (`LOVABLE_API_KEY`) só funciona dentro
da Lovable e pode ficar vazia.

## 8. Publicar

```bash
bun install
bun run build
```

O build usa Nitro com alvo Cloudflare por padrão — caminho mais direto para
publicar em Cloudflare Workers. Vercel e Netlify também funcionam ajustando o
preset do Nitro. Cadastre as variáveis de ambiente no painel do provedor.

Testes obrigatórios após publicar: login, criar orçamento, anexar PDF, mover lead
no kanban, cobranças e Conselho de IA.

## 9. Desligar o ambiente antigo

Só depois de tudo validado. Mantenha os dois no ar por alguns dias, cadastrando
apenas no ambiente novo para não dividir informação.

## Observações técnicas

- `@lovable.dev/vite-tanstack-config` (devDependency) agrupa os plugins do Vite
  (tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro). Pode continuar
  como está; se quiser removê-lo, declare esses plugins manualmente em
  `vite.config.ts`.
- `src/lib/lovable-error-reporting.ts` é apenas telemetria de erros e pode ser
  removido sem impacto funcional.
- Os arquivos em `src/integrations/supabase/` (`client.ts`, `types.ts`) apontam
  para o projeto atual; regenere os tipos no projeto novo com
  `supabase gen types typescript`.
