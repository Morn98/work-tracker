# Work Tracker - Architecture Documentation

> **Purpose**: This document provides comprehensive architectural context for AI assistants and developers to understand the codebase structure, patterns, and data flow without reading multiple source files.

## Table of Contents
1. [System Overview](#system-overview)
2. [Data Storage Architecture](#data-storage-architecture)
3. [Multi-Device Timer Sync](#multi-device-timer-sync)
4. [Component Architecture](#component-architecture)
5. [State Management](#state-management)
6. [Type System](#type-system)
7. [Request Caching](#request-caching)
8. [Common Patterns](#common-patterns)
9. [Quick Decision Trees](#quick-decision-trees)
10. [File Locations](#file-locations)

---

## System Overview

**Technology Stack**:
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS 4
- **Routing**: React Router 7
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Local Storage**: Browser localStorage for offline-first pattern
- **State**: React Context + Custom Hooks (no Redux/Zustand)

**Key Architectural Principles**:
- **Offline-First**: All data immediately saved to localStorage, synced to Supabase in background
- **Optimistic Updates**: UI updates instantly, errors handled gracefully
- **Type Safety**: Comprehensive TypeScript interfaces for all data
- **Multi-Device Sync**: Real-time updates via Supabase Realtime subscriptions
- **Frontend Aggregation**: All statistics calculated client-side

---

## Data Storage Architecture

### Dual-Layer Storage Pattern

```
User Action (e.g., start timer)
    ↓
localStorage (synchronous, instant UI update)
    ↓
Supabase Database (asynchronous, background sync)
    ↓
Realtime Subscriptions (broadcast to other devices/tabs)
```

### Layer 1: localStorage (`src/lib/storage.ts`)

**Purpose**: Instant access for offline-first UX

**Stored Data**:
- Application settings (theme preference)
- Active timer state (for cross-tab sync)

**Key Functions**:
```typescript
getSettings(): AppSettings | null
saveSettings(settings: AppSettings): void
getActiveTimer(): ActiveTimerData | null
saveActiveTimer(data: ActiveTimerData): void
```

**Storage Keys**:
- `worktracker-settings` - App settings JSON
- `worktracker-active-timer` - Active timer state JSON

### Layer 2: Supabase (`src/lib/database.ts`)

**Purpose**: Persistent storage, multi-device sync, backup

**Tables**:
- `projects` - User's project list
- `time_entries` - Completed and active time tracking sessions
- `active_timers` - Currently running timers (one per user)

**Key Functions**:
```typescript
// Projects
fetchProjects(userId: string): Promise<Project[]>
saveProject(project: Project, userId: string): Promise<void>
deleteProject(projectId: string): Promise<void>

// Time Entries
fetchTimeEntries(userId: string): Promise<TimeEntry[]>
saveTimeEntry(entry: TimeEntry, userId: string): Promise<void>
deleteTimeEntry(entryId: string): Promise<void>

// Active Timer (multi-device sync)
fetchActiveTimer(userId: string): Promise<ActiveTimerData | null>
saveActiveTimerToDb(timer: ActiveTimerData, userId: string): Promise<void>
deleteActiveTimer(userId: string): Promise<void>

// Realtime Subscriptions
subscribeToActiveTimer(userId: string, callback: Function): Subscription
```

### Type Conversion Pipeline

**Problem**: Database stores timestamps as ISO strings, app uses numeric timestamps (ms since epoch)

**Solution**: Automatic conversion in database layer

```typescript
// Database Row Types (snake_case, string timestamps)
interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;  // ISO string from Postgres
  updated_at: string;
}

// App Types (camelCase, numeric timestamps)
interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: number;  // ms since epoch
  updatedAt: number;
}

// Converters (in database.ts)
rowToProject(row: ProjectRow): Project
projectToInsert(project: Project, userId: string): ProjectRow
```

---

## Multi-Device Timer Sync

### The Problem
User starts timer on Device A, switches to Device B, expects timer to continue running.

### The Solution

**Three-Way Sync** (localStorage + Supabase + Realtime):

```typescript
// 1. Device A starts timer
useTimer.start(projectId) {
  const timerData = { projectId, startTime: Date.now(), state: 'running', ... }

  // Instant local save
  saveActiveTimer(timerData)  // localStorage

  // Background sync
  await saveActiveTimerToDb(timerData, userId)  // Supabase
}

// 2. Device B receives update
useEffect(() => {
  // Subscribe to Supabase Realtime
  const subscription = subscribeToActiveTimer(userId, (updatedTimer) => {
    // Update local state
    setCurrentTimer(updatedTimer)
    // Update localStorage for cross-tab sync
    saveActiveTimer(updatedTimer)
  })
}, [userId])

// 3. Cross-tab sync (same browser, different tabs)
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'worktracker-active-timer') {
      const updatedTimer = JSON.parse(e.newValue)
      syncTimerState(updatedTimer)
    }
  }
  window.addEventListener('storage', handleStorageChange)
}, [])
```

### Conflict Resolution

**Strategy**: Last-write-wins based on `updatedAt` timestamp

```typescript
const syncFromStorage = async () => {
  const localTimer = getActiveTimer()        // localStorage
  const dbTimer = await fetchActiveTimer()   // Supabase

  if (!localTimer && !dbTimer) return null

  if (localTimer && !dbTimer) {
    // Local exists, DB doesn't → sync to DB
    await saveActiveTimerToDb(localTimer)
    return localTimer
  }

  if (dbTimer && !localTimer) {
    // DB exists, local doesn't → sync to local
    saveActiveTimer(dbTimer)
    return dbTimer
  }

  // Both exist → use newest based on updatedAt
  const timerToUse = dbTimer.updatedAt > localTimer.updatedAt ? dbTimer : localTimer

  // Sync the winner to both layers
  if (timerToUse === dbTimer) saveActiveTimer(dbTimer)
  if (timerToUse === localTimer) await saveActiveTimerToDb(localTimer)

  return timerToUse
}
```

### Stale Timer Detection

**Problem**: Timer left running for days creates incorrect duration

**Solution**: Auto-clear timers older than 24 hours

```typescript
const checkStaleTimer = (timer: ActiveTimerData): boolean => {
  const now = Date.now()
  const age = now - timer.startTime
  const MAX_AGE = 24 * 60 * 60 * 1000  // 24 hours

  if (age > MAX_AGE) {
    clearActiveTimer()  // Remove from both layers
    return true
  }
  return false
}
```

---

## Component Architecture

### Directory Structure

```
src/components/
├── ui/               # Base UI components (presentational)
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Header.tsx
│   ├── StatCard.tsx
│   ├── EmptyState.tsx
│   └── PageContainer.tsx
├── auth/             # Authentication guards
│   └── ProtectedRoute.tsx
├── timer/            # Timer-specific features
│   └── ManualEntry.tsx
├── charts/           # Data visualization
│   ├── BarChart.tsx
│   └── PieChart.tsx
└── sessions/         # Time entry display
    └── SessionItem.tsx
```

### Page Components (Route Handlers)

**Dashboard** (`src/pages/Dashboard.tsx`)
- **Data**: Projects + all time entries
- **Calculations**: Today total, week total, recent sessions
- **Components**: StatCard, SessionItem, EmptyState

**Timer** (`src/pages/Timer.tsx`)
- **Data**: useTimer hook, today's sessions
- **Features**: Start/pause/resume/stop, manual entry form
- **Components**: ManualEntry, SessionItem

**Projects** (`src/pages/Projects.tsx`)
- **Data**: useProjects hook
- **Features**: Create, edit, delete, color picker, archive
- **Components**: Card, Button

**Statistics** (`src/pages/Statistics.tsx`)
- **Data**: All time entries, projects
- **Calculations**: Monthly breakdown, daily totals, top projects
- **Components**: BarChart, PieChart

**Settings** (`src/pages/Settings.tsx`)
- **Features**: Theme toggle, data export/import, clear data
- **Data**: Theme context, export/import utilities

**Login/Signup** (`src/pages/Login.tsx`, `Signup.tsx`)
- **Features**: Authentication forms
- **Data**: AuthContext methods

### Component Communication Patterns

**Pattern 1: Context + Hooks** (Preferred)
```typescript
// No prop drilling - components access shared state via hooks
const Timer = () => {
  const { user } = useAuth()           // From AuthContext
  const { theme } = useTheme()         // From ThemeContext
  const { projects } = useProjects()   // Custom hook
  const timer = useTimer()             // Custom hook
}
```

**Pattern 2: Props** (For reusable UI components)
```typescript
<SessionItem
  entry={timeEntry}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

**Pattern 3: Callback Props** (For actions)
```typescript
<ManualEntry
  onSubmit={async (entry) => {
    await saveTimeEntry(entry)
    refreshSessions()
  }}
/>
```

---

## State Management

### Custom Hooks (Business Logic)

**useTimer** (`src/hooks/useTimer.ts`)
- **Responsibility**: Timer state machine, multi-device sync
- **State**: `'idle' | 'running' | 'paused'`
- **Methods**: `start()`, `pause()`, `resume()`, `stop()`, `reset()`
- **Syncs**: localStorage + Supabase + Realtime subscriptions
- **Returns**:
  ```typescript
  {
    elapsedTime: number,              // Seconds
    state: TimerState,
    currentEntry: TimeEntry | null,
    start(projectId, description?): void,
    pause(): void,
    resume(): void,
    stop(): Promise<void>,
    reset(): void,
    isSyncing: boolean,
    syncError: Error | null
  }
  ```

**useProjects** (`src/hooks/useProjects.ts`)
- **Responsibility**: Project CRUD operations
- **Auto-fetches**: On mount for authenticated users
- **Returns**:
  ```typescript
  {
    projects: Project[],
    isLoading: boolean,
    error: string | null,
    refresh(): Promise<void>
  }
  ```

**useTodaySessions** (`src/hooks/useTodaySessions.ts`)
- **Responsibility**: Filter time entries for today
- **Dependency**: `refreshTrigger` prop for manual refetch
- **Returns**:
  ```typescript
  {
    sessions: TimeEntry[],
    isLoading: boolean
  }
  ```

### Context Providers (Global State)

**AuthContext** (`src/contexts/AuthContext.tsx`)
- **State**: Current user, session, loading status
- **Methods**:
  ```typescript
  {
    user: User | null,
    session: Session | null,
    loading: boolean,
    signUp(email, password): Promise<{ error }>
    signIn(email, password): Promise<{ error }>
    signOut(): Promise<void>
  }
  ```
- **Usage**: Wrap entire app in `<AuthProvider>`, access via `useAuth()`

**ThemeContext** (`src/contexts/ThemeContext.tsx`)
- **State**: `'light' | 'dark' | 'system'`
- **Persistence**: Syncs to localStorage
- **System Integration**: Listens to OS theme changes via MediaQuery API
- **Methods**:
  ```typescript
  {
    theme: Theme,
    setTheme(theme: Theme): void,
    toggleTheme(): void  // Cycles light → dark → system
  }
  ```

---

## Type System

### Core Data Types (`src/types/index.ts`)

**Project**
```typescript
interface Project {
  id: string;                    // UUID
  name: string;
  description?: string;
  color: string;                 // Hex color (e.g., '#3B82F6')
  createdAt: number;            // Timestamp (ms since epoch)
  updatedAt: number;
  isArchived?: boolean;         // Soft delete
}
```

**TimeEntry** (Dual-purpose: active and completed sessions)
```typescript
interface TimeEntry {
  id: string;                    // UUID
  projectId: string;             // Foreign key to Project
  startTime: number;            // Timestamp (ms)
  endTime?: number;             // null if active, set when completed
  description?: string;
  duration?: number;            // In seconds (calculated)
  createdAt: number;
  updatedAt: number;
  isManual?: boolean;           // true if manually entered, false if from timer
}
```

**ActiveTimerData** (For multi-device sync)
```typescript
interface ActiveTimerData {
  id: string;
  projectId: string;
  startTime: number;            // When timer started
  description?: string;
  timerState: 'running' | 'paused';
  pausedDuration: number;       // Accumulated seconds while paused
  createdAt: number;
  updatedAt: number;            // For conflict resolution (last-write-wins)
}
```

**ExportData** (Backup/migration format)
```typescript
interface ExportData {
  version: string;              // Schema version (e.g., '1.0.0')
  exportedAt: number;           // Timestamp
  appVersion: string;           // App version at export time
  projects: Project[];
  timeEntries: TimeEntry[];
  settings?: AppSettings;
  summary: {
    totalProjects: number,
    totalSessions: number,
    totalHoursTracked: number,
    dateRange: {
      earliest: number,
      latest: number
    }
  }
}
```

**AppSettings** (User preferences)
```typescript
interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  // Future: notification preferences, default break duration, etc.
}
```

---

## Request Caching

### RequestCache (`src/lib/requestCache.ts`)

**Purpose**: Prevent redundant API calls, improve performance

**Features**:
1. **Deduplication**: Multiple simultaneous requests for same data return single promise
2. **TTL Caching**: Results cached for 5 seconds by default
3. **Pattern-based Invalidation**: Clear multiple related cache keys at once

**Usage Example**:
```typescript
// In database.ts
const cache = new RequestCache();

export const fetchProjects = async (userId: string): Promise<Project[]> => {
  return cache.get(
    `projects:${userId}`,  // Unique cache key
    async () => {
      // Actual fetch logic
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data.map(rowToProject);
    }
  );
};

// Invalidate cache when data changes
export const saveProject = async (project: Project, userId: string) => {
  await supabase.from('projects').upsert(projectToInsert(project, userId));

  // Clear cached projects so next fetch gets fresh data
  cache.clearPattern(`projects:${userId}`);
};
```

**Invalidation Patterns**:
```typescript
cache.clearPattern('time_entries')      // Clears all time entry caches
cache.clearPattern('time_entries|recent_sessions')  // Clears both patterns
cache.clear()                            // Clear all cache
```

**Benefits**:
- Dashboard with 3 components requesting same projects → 1 database call
- Rapid navigation between pages → cached data serves requests
- Prevents race conditions from concurrent requests

---

## Common Patterns

### Pattern 1: Optimistic Updates

**Principle**: Update UI immediately, sync to database in background, handle errors gracefully

**Implementation**:
```typescript
const handleDeleteProject = async (projectId: string) => {
  // 1. Optimistic update (instant UI feedback)
  setProjects(prev => prev.filter(p => p.id !== projectId));

  try {
    // 2. Background sync
    await deleteProject(projectId);

    // 3. Success feedback (optional)
    showSuccess('Project deleted');
  } catch (error) {
    // 4. Rollback on error
    setProjects(prev => [...prev, deletedProject]);
    showError('Failed to delete project');
  }
};
```

**Used In**: Timer start/stop, project CRUD, manual entry submission

### Pattern 2: Graceful Error Degradation

**Principle**: Database errors don't break the app; fallback to localStorage

**Implementation**:
```typescript
const syncTimer = async (timerData: ActiveTimerData) => {
  // Always save locally first (guaranteed to work)
  saveActiveTimer(timerData);

  try {
    // Attempt cloud sync
    await saveActiveTimerToDb(timerData, userId);
  } catch (error) {
    // Log error but don't throw (app continues working offline)
    console.error('Sync failed, working offline:', error);
    setSyncError(error);
  }
};
```

**Used In**: Timer sync, project save, time entry save

### Pattern 3: Frontend Aggregation

**Principle**: Calculate statistics on client-side, not server-side

**Why**:
- Enables offline analytics
- Reduces server load
- Simplifies backend (no aggregation queries)
- Faster iteration (no backend changes needed)

**Implementation**:
```typescript
// Fetch all data once
const entries = await fetchTimeEntries(userId);
const projects = await fetchProjects(userId);

// Calculate all stats client-side
const todayTotal = getTodayTotal(entries);
const weeklyTotal = getWeeklyTotal(entries);
const projectStats = groupSessionsByProject(entries, projects);
const dailyBreakdown = getDailyBreakdown(entries, 7);
```

**Trade-off**: Works well for individual users with <10k entries; large datasets might need server aggregation

### Pattern 4: Type-Safe Database Layer

**Principle**: Convert between database types and app types at the boundary

**Benefits**:
- App code works with clean types (numeric timestamps, camelCase)
- Database works with standard types (ISO timestamps, snake_case)
- Single source of truth for conversions (database.ts)

**Implementation**:
```typescript
// Converters live in database.ts
const rowToProject = (row: ProjectRow): Project => ({
  id: row.id,
  name: row.name,
  color: row.color,
  createdAt: new Date(row.created_at).getTime(),  // ISO → ms
  updatedAt: new Date(row.updated_at).getTime(),
  isArchived: row.is_archived ?? false
});

// All database functions use converters
export const fetchProjects = async (userId: string): Promise<Project[]> => {
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId);

  return data.map(rowToProject);  // Convert all rows
};
```

---

## Quick Decision Trees

### "I need to add/modify..."

**Timer Functionality**
- Files: `src/hooks/useTimer.ts`, `src/pages/Timer.tsx`, `src/lib/database.ts`
- Pattern: Update useTimer hook → UI updates automatically via hook return values

**Project Management**
- Files: `src/hooks/useProjects.ts`, `src/pages/Projects.tsx`, `src/lib/database.ts`
- Pattern: Add method to useProjects → call from Projects page

**Statistics/Analytics**
- Files: `src/utils/statistics.ts`, `src/pages/Statistics.tsx`
- Pattern: Add calculation function → use in Statistics page

**UI Component**
- Files: `src/components/ui/` for reusable, `src/components/` for feature-specific
- Pattern: Create component → import in page/component

**Data Type**
- Files: `src/types/index.ts` for interface, `src/lib/database.ts` for converters
- Pattern: Add interface → add database row type → add converters

**Authentication**
- Files: `src/contexts/AuthContext.tsx`, `src/pages/Login.tsx` or `Signup.tsx`
- Pattern: Add method to AuthContext → call from auth pages

**Theme/Settings**
- Files: `src/contexts/ThemeContext.tsx`, `src/lib/storage.ts`, `src/pages/Settings.tsx`
- Pattern: Update context → persist to localStorage → add UI in Settings

**Database Table**
- Files: Supabase dashboard (schema), `src/lib/database.ts` (CRUD), `src/types/index.ts` (types)
- Pattern: Create table → add types → add CRUD functions → add converters

### "I'm seeing a bug in..."

**Timer not syncing**
- Check: `useTimer.ts` sync logic, localStorage keys, Supabase Realtime subscription
- Debug: Console log `syncFromStorage()` calls, check network tab for Supabase calls

**Data not persisting**
- Check: `database.ts` save functions, Supabase policies (RLS), auth state
- Debug: Try in Supabase dashboard directly, check `error` object

**Statistics wrong**
- Check: `utils/statistics.ts` calculation functions, date boundaries
- Debug: Log raw `entries` array, verify filter logic

**Cross-device sync issues**
- Check: `subscribeToActiveTimer()` in database.ts, Realtime subscription status
- Debug: Check Supabase Realtime logs, verify `updatedAt` conflict resolution

**Theme not persisting**
- Check: `ThemeContext.tsx` localStorage save, `storage.ts` functions
- Debug: Check localStorage in DevTools, verify `getSettings()` call on mount

---

## File Locations

### Core Business Logic
- `src/lib/database.ts` - All Supabase CRUD operations, type converters, Realtime subscriptions
- `src/lib/storage.ts` - localStorage wrapper for settings and active timer
- `src/lib/supabase.ts` - Supabase client initialization
- `src/lib/requestCache.ts` - Request deduplication and caching

### State Management
- `src/hooks/useTimer.ts` - Timer state machine and sync logic
- `src/hooks/useProjects.ts` - Project data management
- `src/hooks/useTodaySessions.ts` - Today's sessions filtering
- `src/contexts/AuthContext.tsx` - Authentication state provider
- `src/contexts/ThemeContext.tsx` - Theme state provider

### UI Pages
- `src/pages/Dashboard.tsx` - Overview with stats and recent sessions
- `src/pages/Timer.tsx` - Active timer and manual entry
- `src/pages/Projects.tsx` - Project CRUD interface
- `src/pages/Statistics.tsx` - Charts and analytics
- `src/pages/Settings.tsx` - App settings and data management
- `src/pages/Login.tsx`, `Signup.tsx` - Authentication forms

### Components
- `src/components/ui/` - Base UI components (Button, Card, Header, etc.)
- `src/components/auth/ProtectedRoute.tsx` - Auth guard for routes
- `src/components/timer/ManualEntry.tsx` - Manual time entry form
- `src/components/charts/` - BarChart, PieChart visualization components
- `src/components/sessions/SessionItem.tsx` - Individual time entry display

### Utilities
- `src/utils/statistics.ts` - Data aggregation and calculations
- `src/utils/formatTime.ts` - Time formatting helpers
- `src/utils/dateHelpers.ts` - Date manipulation utilities
- `src/utils/errorHandler.ts` - User feedback utilities (alerts)
- `src/utils/exportData.ts` - Data export functionality
- `src/utils/importData.ts` - Data import functionality

### Configuration
- `src/types/index.ts` - TypeScript interfaces and types
- `src/constants/index.ts` - App-wide constants (time units, limits, defaults)
- `src/App.tsx` - Root routing and context providers
- `src/main.tsx` - React app entry point

---

## Performance Considerations

### Current Optimizations
- Request caching with 5-second TTL
- Frontend aggregation (no backend queries for stats)
- Optimistic updates (instant UI feedback)
- Realtime subscriptions (no polling)

### Potential Bottlenecks (Future)
- **Large datasets**: >1000 time entries might slow statistics page
  - Solution: Virtual scrolling, pagination, or backend aggregation
- **Realtime subscription overhead**: Many connected devices
  - Solution: Debounce updates, batch writes
- **localStorage size limits**: Browser limit ~5-10MB
  - Solution: Implement data archival, move old entries to Supabase only

### When to Optimize
- Statistics page >2s load time → backend aggregation
- Session list >500 items → virtual scrolling (react-window)
- localStorage quota errors → data archival strategy

---

## Testing Strategy (Future)

**Recommended Structure**:
- Unit tests: `src/utils/*.test.ts` (statistics, formatTime, dateHelpers)
- Hook tests: `src/hooks/*.test.ts` (useTimer, useProjects)
- Integration tests: Timer sync, authentication flow
- E2E tests: Cypress for critical paths (start timer → stop → view stats)

**Critical Test Cases**:
1. Timer sync across devices (conflict resolution)
2. Offline mode (localStorage fallback when database fails)
3. Data export/import (schema compatibility)
4. Stale timer detection (>24 hours)
5. Multi-tab sync (storage event listener)

---

## Migration Guide

### Adding a New Database Table

1. **Create table in Supabase dashboard**
   ```sql
   CREATE TABLE new_table (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Add Row Policy (RLS)**
   ```sql
   ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users can access own data" ON new_table
     FOR ALL USING (auth.uid() = user_id);
   ```

3. **Add TypeScript types** in `src/types/index.ts`
   ```typescript
   interface NewType {
     id: string;
     createdAt: number;  // App uses ms timestamps
   }
   ```

4. **Add database row type and converters** in `src/lib/database.ts`
   ```typescript
   interface NewTypeRow {
     id: string;
     user_id: string;
     created_at: string;  // Postgres uses ISO strings
   }

   const rowToNewType = (row: NewTypeRow): NewType => ({ ... });
   const newTypeToInsert = (item: NewType, userId: string): NewTypeRow => ({ ... });
   ```

5. **Add CRUD functions** in `src/lib/database.ts`
   ```typescript
   export const fetchNewTypes = async (userId: string): Promise<NewType[]> => { ... }
   export const saveNewType = async (item: NewType, userId: string): Promise<void> => { ... }
   ```

6. **Create custom hook** in `src/hooks/useNewTypes.ts`
   ```typescript
   export const useNewTypes = () => {
     const [items, setItems] = useState<NewType[]>([]);
     // Fetch, error handling, refresh logic
   };
   ```

---

**Last Updated**: 2025-12-14
**Maintained By**: AI-assisted development team
