# Type the Truth

> Digite sua jornada pelas Escrituras. Uma experiência de digitação focada e minimalista — capítulo a capítulo, pela Bíblia inteira.

Inspirado no [Monkeytype](https://monkeytype.com), mas pensado como ferramenta de disciplina espiritual, não como jogo de velocidade.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · SQLite

---

## Rodando o projeto

Nenhum serviço externo é necessário — o banco é um arquivo SQLite local.

```bash
# 1. Instalar dependências
npm install

# 2. Criar o banco e carregar a Bíblia completa (31.105 versículos)
npm run db:setup

# 3. Rodar
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000), crie uma conta e comece a digitar.

### Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run db:setup` | `db push` + seed de referência + seed da Bíblia (tudo de uma vez) |
| `npm run db:seed` | Livros, capítulos, conquistas e planos (idempotente) |
| `npm run db:seed:bible` | Versículos a partir de `scripts/data/pt_nvi.json` (idempotente) |
| `npm run db:studio` | Prisma Studio para inspecionar o banco |
| `npm run typecheck` | Checagem de tipos |

---

## Funcionalidades

- **Tela de digitação** estilo Monkeytype: feedback caractere a caractere, caret animado, PPM, precisão, erros e tempo em tempo real. Prefixos de versículo `[n]` são exibidos mas pulados automaticamente.
- **Retomar de onde parou** — o progresso de cada capítulo é salvo localmente a cada tecla; feche e volte depois.
- **Progresso persistente** — capítulos concluídos, melhor PPM/precisão por capítulo, total de versículos digitados.
- **Mapa Bíblico** — os 66 livros com % de conclusão e grade de capítulos clicável.
- **Sequência diária (streak)** — com dia de graça após 7 dias de sequência (1x a cada 30 dias) e sem mensagens de culpa.
- **Conquistas** — progresso, volume, consistência e precisão; exibidas na tela de conclusão ao desbloquear.
- **Planos de leitura** — Evangelho de João, Os Quatro Evangelhos, Salmos & Provérbios.
- **Temas desbloqueáveis** — Pergaminho é liberado ao completar o primeiro capítulo.
- **Auth local** — e-mail/senha com scrypt + sessão em cookie httpOnly. Zero serviços externos.

## Arquitetura

```
src/
├── app/
│   ├── (auth)/            ← login, signup
│   ├── (app)/             ← páginas com sidebar (dashboard, mapa, conquistas, planos, perfil, configurações)
│   ├── (focus)/type/      ← tela de digitação (sem distrações, sem sidebar)
│   ├── api/               ← sessions, plans/enroll, auth/signout
│   ├── globals.css        ← design tokens (temas via CSS variables)
│   └── app.css            ← estilos de componentes
├── components/
│   ├── typing/TypingScreen.tsx   ← engine de digitação
│   └── layout/                   ← Sidebar, Brand
├── lib/
│   ├── auth.ts            ← sessões + hash de senha (scrypt)
│   ├── streak.ts          ← regras de sequência diária
│   ├── achievements.ts    ← engine de conquistas
│   └── prisma.ts
└── middleware.ts          ← checagem leve do cookie de sessão

prisma/schema.prisma       ← SQLite (dev.db, fora do git)
scripts/seed.ts            ← dados de referência
scripts/seed-bible.ts      ← versículos NVI
```

### Decisões principais (vs. protótipo anterior)

| Antes | Agora | Por quê |
|---|---|---|
| Supabase (Postgres + Auth) | SQLite + auth local | O projeto Supabase original foi desativado; sem dependências externas o app roda em qualquer máquina com `npm run db:setup` |
| Engine com estado duplicado (Zustand + componente) | Engine única em `TypingScreen` | O protótipo tinha duas engines, uma morta; a nova corrige perda de teclas, backspace inconsistente e re-render do capítulo inteiro a cada tecla |
| Digitação dentro do layout com sidebar | Route group `(focus)` | "O texto é o herói" — tela de digitação sem navegação |

### Engine de digitação — notas

- O estado autoritativo (cursor, estado por letra, erros) vive em **refs**; o React recebe commits como uma string de estados por palavra. Palavras inalteradas não re-renderizam (`React.memo`) — Salmo 119 digita liso.
- O handler de `input` processa o valor inteiro do textarea, então eventos com múltiplos caracteres (IME, autocomplete, mobile) não perdem teclas.
- Espaços entre versículos são digitáveis (como espaços entre palavras no Monkeytype); prefixos `[n]` avançam sozinhos.

## Conteúdo bíblico e licença

O texto carregado é a **NVI em português** (`scripts/data/pt_nvi.json`), que é © Biblica e **não é de domínio público** — uso estritamente pessoal/local. Para publicar o app, troque por uma tradução de domínio público (ex.: Almeida Revisada e Corrigida, ou World English Bible em inglês): basta criar um novo registro em `translations` e adaptar o seed — o schema já suporta múltiplas traduções.

## Deploy (futuro)

Para produção será preciso migrar o `datasource` do Prisma para Postgres (Neon, Supabase, Railway...) e definir `AUTH_SECRET` forte — o restante do código não depende do SQLite.
