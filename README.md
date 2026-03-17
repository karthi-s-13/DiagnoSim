<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# DiagoSim

This repo contains a Vite + React frontend served through a small Express dev server.

## Prerequisites

- Node.js 20+
- A Gemini API key
- A valid Firebase app config in [`firebase-applet-config.json`](./firebase-applet-config.json)

## Local setup

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local`
3. Set `GEMINI_API_KEY` in `.env.local`
4. Start the app:
   `npm run dev`

The server listens on `http://localhost:3000`.

If PowerShell blocks `npm` with an execution policy error, run the Windows command wrapper instead:

`npm.cmd run dev`

## Checks

- Type check: `npm run lint`
- Production build: `npm run build`
- Remove build output: `npm run clean`
