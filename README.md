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

No real secrets are required for the current site. Use `.env.example` as the template if future public Vite variables are added.
