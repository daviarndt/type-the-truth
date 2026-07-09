# Type the Truth

> Digite sua jornada pelas Escrituras. Uma experiência de digitação focada e minimalista — capítulo a capítulo, pela Bíblia inteira.

Inspirado no [Monkeytype](https://monkeytype.com), mas pensado como ferramenta de disciplina espiritual, não como jogo de velocidade.

**Local-first** — site estático, sem servidor próprio. Todo o progresso vive no seu navegador (IndexedDB) e funciona offline. Opcionalmente, você pode ligar a **sincronização na nuvem** (login com Google via Firebase) para ter backup automático e continuar entre dispositivos — sem isso, o app roda 100% local.

**Stack:** Next.js 14 (App Router, `output: export`) · TypeScript · Tailwind CSS · IndexedDB (via `idb`) · Firebase Auth + Firestore (opcional)

---

## Rodando o projeto

```bash
# 1. Instalar dependências
npm install

# 2. Gerar os arquivos da Bíblia (public/bible/*.json) — só na 1ª vez
npm run build:bible

# 3. Desenvolvimento
npm run dev            # http://localhost:3000

# 4. Build estático (gera ./out com HTML/JS puro)
npm run build
npm start              # serve o ./out localmente
```

O conteúdo de `out/` pode ser hospedado em **qualquer host estático** (GitHub Pages, Netlify, Vercel, Cloudflare Pages…). Não há backend.

### Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build estático → `./out` |
| `npm run build:bible` | Gera `public/bible/{Livro}.json` a partir de `scripts/data/pt_nvi.json` |
| `npm run typecheck` | Checagem de tipos |

---

## Funcionalidades

- **Tela de digitação** estilo Monkeytype: feedback caractere a caractere, caret animado, PPM, precisão, erros e tempo em tempo real. Prefixos de versículo `[n]` são exibidos mas pulados automaticamente.
- **Retomar de onde parou** — o progresso do capítulo é salvo no navegador a cada instante.
- **Continuar de onde parei** — o dashboard retoma o último capítulo digitado em qualquer livro (não força começar por Gênesis).
- **Seletor de livro/capítulo** — vá direto para qualquer trecho (dashboard e tela de digitação).
- **Progresso, mapa bíblico, sequência (streak), conquistas e planos de leitura.**
- **Heatmap de atividade** (últimas 26 semanas) no perfil.
- **Backup** — exporte/importe um arquivo `.json` com todo o seu progresso (para não perder ou levar a outro dispositivo).
- **PWA instalável** e **funciona offline** (service worker faz cache do app e dos capítulos já visitados).
- **Bilíngue** (PT-BR / EN) na interface, **3 temas** (Escuro, Claro, Pergaminho), **som de teclado** opcional e **tamanho de fonte** ajustável.

### Atalhos da tela de digitação

| Atalho | Ação |
|---|---|
| Qualquer tecla | Começa a sessão |
| `Tab` → `Enter` | Reinicia o capítulo |
| `Esc` | Sai para o dashboard |

---

## Arquitetura

```
src/
├── app/
│   ├── (app)/            ← páginas com sidebar (dashboard, mapa, conquistas, planos, perfil, configurações)
│   ├── (focus)/type/     ← tela de digitação (sem distrações)
│   ├── layout.tsx        ← AppProvider (settings/i18n/tema) + registro do service worker
│   ├── globals.css       ← design tokens (temas via CSS variables)
│   └── app.css           ← estilos de componentes
├── components/
│   ├── AppProvider.tsx   ← estado global: settings (IndexedDB), i18n, tema
│   ├── typing/TypingScreen.tsx
│   ├── ChapterPicker.tsx · Heatmap.tsx · ServiceWorkerRegister.tsx
│   └── layout/           ← Sidebar, Brand
└── lib/
    ├── db.ts             ← IndexedDB (progresso, sessões, streak, conquistas, settings, resume) + export/import
    ├── bible.ts          ← carrega capítulos de public/bible/
    ├── books.ts          ← metadados dos 66 livros (estático)
    ├── paths.ts          ← planos de leitura (estático)
    ├── achievements.ts   ← definições + avaliação client-side
    ├── streak.ts · stats.ts · save.ts · i18n.ts · utils.ts

public/
├── bible/{Livro}.json    ← versículos (gerado por build:bible)
├── manifest.webmanifest · sw.js · icon.svg
scripts/
├── build-bible.mjs       ← gera public/bible/ a partir de pt_nvi.json
└── data/pt_nvi.json      ← fonte (NVI)
```

### Por que sem servidor?

É um projeto de hobby para site estático. Sem backend não há banco de dados para manter, custo de hospedagem, contas de usuário nem superfície de ataque. A troca: o progresso é por-navegador — daí o **backup exportável** cobrir a portabilidade entre dispositivos.

---

## Sincronização na nuvem (opcional)

Por padrão o app é **100% local**. Se quiser login + backup automático + sync entre dispositivos, ligue o Firebase (tier gratuito, não pausa por inatividade). O modelo é **local-first**: o IndexedDB continua sendo a fonte da verdade; ao entrar, o app baixa a versão da nuvem, **mescla** (nunca perde progresso — mantém o maior PPM/precisão, união de capítulos, sessões e conquistas) e sobe o resultado. Depois, cada capítulo concluído é enviado automaticamente.

### Passo a passo (uma vez)

1. **Crie um projeto** em [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication** → *Get started* → habilite o provedor **Google**.
3. Em **Authentication → Settings → Authorized domains**, adicione seu domínio do Pages: `daviarndt.github.io` (e `localhost` para testes).
4. **Firestore Database** → *Create database* → modo de produção. Em **Rules**, cole:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /saves/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

   Isso garante que **cada usuário só acessa o próprio save**.
5. **Project settings → Your apps → Web app** (`</>`). Copie os 4 valores para as variáveis:

   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`

6. **Local:** copie para `.env.local`. **Produção (GitHub Pages):** adicione os 4 como *Repository secrets* em **Settings → Secrets and variables → Actions** (o workflow já os injeta no build).

> As chaves do Firebase Web são **públicas por design** — a segurança vem das *Security Rules* do passo 4, não do sigilo das chaves. Sem as variáveis, a seção "Conta e sincronização" simplesmente não aparece.

**Limite prático:** o save é gravado como um documento único (máx. 1 MB no Firestore) — dá folga para milhares de sessões. Se um dia isso apertar, dá para migrar o histórico de sessões para uma subcoleção.

## Conteúdo bíblico e licença

O texto carregado é a **NVI em português** (`scripts/data/pt_nvi.json`), que é © Biblica e **não é de domínio público** — uso estritamente pessoal/local. Para publicar o app abertamente, troque por uma tradução de domínio público (ex.: Almeida Revisada e Corrigida): gere novos arquivos em `public/bible/` no mesmo formato (array de capítulos → array de versículos).
