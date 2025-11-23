# Work Tracker — Claude Code AI Summary

## 📝 Project Overview
Work Tracker is a modern web app for tracking time spent on projects. It features a timer, manual entry, statistics visualization, and local/project organization. All data is stored **entirely** in the browser (LocalStorage)—no backend or network sync is used.

## 📦 Key Technologies
- React 19 / TypeScript
- Vite (dev/build)
- TailwindCSS 4
- React Router 7
- LocalStorage (browser only, no API/backend)

## 🗂️ Folder Structure
- `public/`         — Static assets
- `src/`            — App source code
  - `components/`   — UI, charts, timer, and project/session cards
  - `pages/`        — Dashboard, Timer, Projects, Statistics, Settings
  - `lib/`          — LocalStorage access logic
  - `hooks/`        — React custom logic for state/data
  - `contexts/`     — Theme state
  - `constants/`    — Config values
  - `types/`        — App interfaces and types
  - `utils/`        — Helpers (date, formatting, stats)
- `dist/`           — Production build output (auto-gen)

## 🏃‍♂️ Main Scripts (see package.json)
- `dev`         — Run local dev server with HMR
- `build`       — Bundle for production (outputs to `dist/`)
- `preview`     — Preview production build locally
- `deploy`      — Build and publish to GitHub Pages (needs `gh-pages` package)

## ⚙️ Quick Start
1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
2. Dev server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
3. Prod build:
   ```bash
   npm run build
   # or
   yarn build
   ```
4. Deploy (to GitHub Pages):
   ```bash
   npm run deploy
   ```

## 🚨 Data & Limitations
- **Data lives only in browser LocalStorage** — clearing site data or switching browsers/devices will lose data unless exported manually.
- **No backend/server—no sync or external API**
- Default asset/routing base is `/work-tracker/` (for e.g. GitHub Pages)
- Client-only: works offline (after first load), does not send data anywhere

## 📄 Deployment Notes
- Be sure to update the `homepage` field and `base` in Vite config when forking or renaming the repo.
- GitHub Pages deploy uses `gh-pages` package and publishes `dist/`.

## 🙏 Claude Code AI Usage
- Primary logic is in `src/pages/` and `src/lib/storage.ts`, types in `src/types/`.
- Main user flow: add/manage projects → use timer/manual entry → dashboard and stats → export/clear data via settings.
- Changing data storage, API, or authentication means major architectural changes, as app is tightly coupled to browser local persistence.
