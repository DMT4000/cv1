# CV Cursor — Monorepo Scaffold

This repo contains a browser app (`/app`) and a local proxy (`/proxy`).

## Prerequisites

- Node.js >= 18
- pnpm (recommended)

## Setup

1. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.
2. Install deps:

```bash
pnpm i
```

## Develop (npm workspaces)

Run dev servers for app and proxy concurrently:

```bash
npm run dev
```

This uses npm workspaces + `concurrently` to run:

- `npm --workspace app run dev` (Vite)
- `npm --workspace proxy run dev` (Express via tsx)

## Build

```bash
pnpm -r run build
```

## Test

```bash
pnpm -r run test
```


