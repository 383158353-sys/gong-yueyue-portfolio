# Gong Yueyue Portfolio

Red and black personal portfolio website for Gong Yueyue / Emore, built with React, Vite, TypeScript, Tailwind CSS, Three.js, and local media assets.

## Local Development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://127.0.0.1:5173/`.

## Build

```bash
npm run build
```

The production build is written to `dist/`.

## Large Assets

This project contains large videos and portfolio PDFs. They are tracked with Git LFS so the complete website content can stay connected to the GitHub repository without hitting GitHub's normal 100 MB file limit.

Before cloning or deploying, make sure Git LFS is installed:

```bash
git lfs install
git lfs pull
```

## Environment

No real secrets are required for the current site. Use `.env.example` as the template if future public Vite variables are added.
