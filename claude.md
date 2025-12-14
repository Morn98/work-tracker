# Work Tracker — Claude Code AI Summary

> **Quick Links for AI**: See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system design | [COMPONENTS.md](COMPONENTS.md) for component reference

## 📝 Project Overview
Work Tracker is a modern web app for tracking time spent on projects. It features a timer, manual entry, statistics visualization, and project organization. **Data storage uses a dual-layer approach**: localStorage for offline-first UX + Supabase for persistent storage and multi-device sync.

## 📦 Key Technologies
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS 4
- **Routing**: React Router 7
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Local Storage**: Browser localStorage for instant access
- **State**: React Context + Custom Hooks (no Redux/Zustand)

## 🏗️ Architecture Quick Facts
- **Storage Pattern**: Dual-layer (localStorage + Supabase) - See [ARCHITECTURE.md](ARCHITECTURE.md#data-storage-architecture)
- **Data Flow**: Optimistic updates (localStorage instant → Supabase background sync)
- **Multi-Device Sync**: Supabase Realtime subscriptions
- **Offline Support**: localStorage fallback when database unavailable
- **Type Safety**: Automatic conversion between database rows and app types

## 🗂️ Folder Structure
- `public/` — Static assets
- `src/` — App source code
  - `components/` — UI, charts, timer, and session components
  - `pages/` — Dashboard, Timer, Projects, Statistics, Settings, Login, Signup
  - `lib/` — Database layer (Supabase), storage layer (localStorage), caching
  - `hooks/` — useTimer (timer state machine), useProjects, useTodaySessions
  - `contexts/` — AuthContext (authentication), ThemeContext (theme state)
  - `constants/` — App-wide constants (time units, limits, defaults)
  - `types/` — TypeScript interfaces (Project, TimeEntry, ActiveTimerData)
  - `utils/` — Helpers (statistics, formatTime, dateHelpers, export/import)
- `dist/` — Production build output (auto-gen)

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
- **Primary data in Supabase** — persistent across devices/browsers for authenticated users
- **LocalStorage for offline-first** — instant UI updates, works offline, syncs when online
- **Authentication required** — All data is user-scoped via Supabase Auth (email/password)
- Default asset/routing base is `/work-tracker/` (for GitHub Pages deployment)

## 📄 Deployment Notes
- Update `homepage` field and `base` in Vite config when forking or renaming repo
- GitHub Pages deploy uses `gh-pages` package and publishes `dist/`
- Supabase environment variables needed: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## 🤖 AI Assistant Quick Reference

### Decision Tree: "Where do I make changes?"

**Modifying Timer Functionality**
→ Files: `src/hooks/useTimer.ts`, `src/pages/Timer.tsx`, `src/lib/database.ts`
→ Pattern: Update useTimer hook → UI updates automatically via hook return values

**Adding/Changing Project Features**
→ Files: `src/hooks/useProjects.ts`, `src/pages/Projects.tsx`, `src/lib/database.ts`
→ Pattern: Add method to useProjects → call from Projects page → update database layer

**Modifying Statistics/Analytics**
→ Files: `src/utils/statistics.ts`, `src/pages/Statistics.tsx`
→ Pattern: Add calculation function in utilities → use in Statistics page

**Adding New UI Component**
→ Files: `src/components/ui/` (reusable) or `src/components/` (feature-specific)
→ Pattern: Create component → import in page/component → see [COMPONENTS.md](COMPONENTS.md)

**Changing Data Types**
→ Files: `src/types/index.ts` (interface), `src/lib/database.ts` (converters)
→ Pattern: Add/modify interface → add database row type → add converter functions

**Authentication Changes**
→ Files: `src/contexts/AuthContext.tsx`, `src/pages/Login.tsx`, `src/pages/Signup.tsx`
→ Pattern: Add method to AuthContext → call from auth pages

**Theme/Settings Changes**
→ Files: `src/contexts/ThemeContext.tsx`, `src/lib/storage.ts`, `src/pages/Settings.tsx`
→ Pattern: Update context → persist to localStorage → add UI in Settings

### Key Files (Most Frequently Accessed)

**Core Business Logic**
- `src/lib/database.ts` — All Supabase CRUD, type converters, Realtime subscriptions (500+ lines)
- `src/lib/storage.ts` — localStorage wrapper for settings and active timer (150 lines)
- `src/hooks/useTimer.ts` — Timer state machine with multi-device sync (400+ lines)

**State Management**
- `src/contexts/AuthContext.tsx` — Authentication state provider
- `src/contexts/ThemeContext.tsx` — Theme state provider
- `src/hooks/useProjects.ts` — Project data management hook

**Pages (Route Handlers)**
- `src/pages/Dashboard.tsx` — Overview with stats and recent sessions
- `src/pages/Timer.tsx` — Active timer and manual entry
- `src/pages/Projects.tsx` — Project CRUD interface
- `src/pages/Statistics.tsx` — Charts and analytics

**Type System**
- `src/types/index.ts` — All TypeScript interfaces (Project, TimeEntry, ActiveTimerData, etc.)

**Utilities**
- `src/utils/statistics.ts` — Data aggregation and calculations
- `src/utils/formatTime.ts` — Time formatting helpers

### Common Tasks Map

| Task | Files to Modify | Key Functions/Hooks |
|------|----------------|---------------------|
| Add new timer feature | useTimer.ts, Timer.tsx | useTimer() hook |
| Add new statistic | statistics.ts, Statistics.tsx | Add calculation function |
| Add new project field | types/index.ts, database.ts, Projects.tsx | Project interface, converters |
| Change theme behavior | ThemeContext.tsx, storage.ts | setTheme(), toggleTheme() |
| Add new page/route | App.tsx, pages/ | Add route in App.tsx |
| Add new database table | database.ts, types/index.ts | Add CRUD functions, types |
| Fix timer sync issue | useTimer.ts, database.ts | syncFromStorage(), subscribeToActiveTimer() |
| Change export format | exportData.ts, importData.ts | ExportData interface |

### Data Model Quick Reference

```typescript
// Core Types (src/types/index.ts)
Project { id, name, color, createdAt, updatedAt, isArchived? }
TimeEntry { id, projectId, startTime, endTime?, duration?, description?, isManual? }
ActiveTimerData { id, projectId, startTime, timerState, pausedDuration, updatedAt }
AppSettings { theme }
```

**Database Tables** (Supabase)
- `projects` → Project[]
- `time_entries` → TimeEntry[]
- `active_timers` → ActiveTimerData (one per user)

**Type Conversion**: Database uses snake_case + ISO timestamps → App uses camelCase + numeric timestamps (ms)

### User Flow Summary
1. **Sign up/Login** → AuthContext manages session
2. **Create Projects** → Projects page → database.saveProject()
3. **Track Time**:
   - Timer: Start → useTimer hook → syncs to localStorage + Supabase → Stop → creates TimeEntry
   - Manual: ManualEntry form → database.saveTimeEntry()
4. **View Stats** → Dashboard (today/week totals) + Statistics page (charts, breakdown)
5. **Export/Import** → Settings page → exportData/importData utilities

### Multi-Device Sync Architecture
- **Timer sync**: useTimer subscribes to Supabase Realtime → updates across devices
- **Conflict resolution**: Last-write-wins based on `updatedAt` timestamp
- **Cross-tab**: storage events trigger re-sync within same browser
- **Stale timer**: Auto-clear timers >24 hours old

### When to Read Documentation
- **System design questions** → Read [ARCHITECTURE.md](ARCHITECTURE.md)
- **Component questions** → Read [COMPONENTS.md](COMPONENTS.md)
- **Quick reference** → This file (CLAUDE.md)
- **Detailed file logic** → Read file headers (all major files have @module comments)
