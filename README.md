# Gong Yueyue Portfolio

Red and black personal portfolio website for Gong Yueyue / Emore, built with React, Vite, TypeScript, Tailwind CSS, Three.js, and local media assets.

## Local Development

```bash
pnpm install --frozen-lockfile
pnpm run dev
```

Open the local URL printed by Vite, usually `http://127.0.0.1:5173/`.

## Build and test

```bash
pnpm run build
pnpm test
```

The production build is written to `dist/`. `vercel.json` sends other paths back to `index.html`, so the seven routes can be opened directly.

## What changed from 7745266

The visual system, work cards, stills, and the original homepage video plus 《剩余维度》 trailer stay in place. The top navigation is now seven routes: 首页、关于、项目、影片、场景、人物、文章. 影片 keeps the original trailer and adds one labeled test embed, plus a link to the same video on YouTube. The page does not decide whether that embed is actually playing. 关于 uses the existing name and the existing profile card. 文章 is empty. Email is not shown.

Original media stays in Git LFS. Locally, `git lfs pull` produced real files: the homepage video is 139615417 bytes and 66.85 seconds, the trailer is 165991229 bytes and 85.22 seconds, and `residual-dimension.mp4` is 9964759 bytes and 70.33 seconds. These files are not replaced with still images.

## Large Assets

This project contains large videos and portfolio PDFs. They are tracked with Git LFS so the complete website content can stay connected to the GitHub repository without hitting GitHub's normal 100 MB file limit.

Before cloning or deploying, make sure Git LFS is installed:

```bash
git lfs install
git lfs pull
```

## Environment

No real secrets are required for the public pages. Use `.env.example` as the template. The private canvas does not work until the server has both `EDITOR_ACCESS_TOKEN` and a durable store. Leaving them empty makes `/api/editor` reject draft reads and every write.

## Private canvas

`/editor` is a private editing page. Knowing the address is not access. The browser asks for a credential and sends it only to the server; the comparison uses `EDITOR_ACCESS_TOKEN`, which is never written into the page bundle. Drafts are stored by the server, not in `localStorage`. Publish is a separate action. Until that action, `/board` stays empty and the existing seven pages are unchanged.

The drag, snap, grid, and multi-select alignment behavior is adapted from the owner's ejected CanvasArt project, Base44 app id `6ab7badc6b3c55bfd9a45edd`, specifically the algorithms in `snapUtils.js` and `autoLayoutUtils.js`. The source was the owner's own ejected project. This site does not import `@base44/sdk` or `@base44/vite-plugin`, and it does not copy the CanvasArt login, AI, or Google Drive code. No new third-party editor library was added. `lucide-react`, already used by this site, stays under its existing license. Cloud drafts use `@vercel/blob` against a private store. The exact variables are in `docs/editor-storage.md`.

On a local server, `EDITOR_STORE=file` with `EDITOR_STORE_DIR` pointing outside the repository can persist drafts and uploads on disk. That mode is refused when `VERCEL=1`, because a function's disk is not durable storage. This Vercel project currently has no editor token and no blob, database, or key-value store, so the hosted preview fails closed. The checked Supabase project belongs to a different product and is not used.

Text formatting here applies to a whole text box. CanvasArt's per-selection HTML spans were not ported. Desktop `/board` keeps each element's relative position. Narrow `/board` restacks by vertical order instead of reusing desktop pixel coordinates.
