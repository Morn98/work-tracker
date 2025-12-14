# Component Reference

> **Purpose**: Quick lookup table for all components, their responsibilities, props, and usage locations. Use this to quickly find the right component without reading source files.

## Quick Navigation
- [Page Components](#page-components) - Full-page route handlers
- [UI Components](#ui-components) - Reusable base components
- [Feature Components](#feature-components) - Feature-specific components
- [Layout Components](#layout-components) - Page structure and navigation
- [Auth Components](#auth-components) - Authentication guards

---

## Page Components

These are route-level components that compose other components into full pages.

| Component | Route | Data Dependencies | Key Features | File |
|-----------|-------|-------------------|--------------|------|
| **Dashboard** | `/` | Projects, all time entries | Today/week totals, recent sessions, quick stats | `src/pages/Dashboard.tsx` |
| **Timer** | `/timer` | Active timer state, today's sessions | Start/pause/resume/stop timer, manual entry form | `src/pages/Timer.tsx` |
| **Projects** | `/projects` | Projects list | Create/edit/delete projects, color picker, archive | `src/pages/Projects.tsx` |
| **Statistics** | `/statistics` | Projects, all time entries | Monthly breakdown, daily chart, top projects pie chart | `src/pages/Statistics.tsx` |
| **Settings** | `/settings` | App settings, theme | Theme toggle, export/import data, clear data | `src/pages/Settings.tsx` |
| **Login** | `/login` | AuthContext | Email/password login form | `src/pages/Login.tsx` |
| **Signup** | `/signup` | AuthContext | Email/password signup form | `src/pages/Signup.tsx` |

### Dashboard Component Details
```typescript
// Data fetched
const { projects } = useProjects()
const entries = await fetchTimeEntries(userId)

// Calculations performed
- Today's total time
- This week's total time
- Recent sessions (last 10)
- Active projects count

// Components used
- StatCard (for metrics)
- SessionItem (for recent sessions)
- EmptyState (when no data)
```

### Timer Component Details
```typescript
// State managed
const timer = useTimer()  // Active timer state
const [refreshTrigger, setRefreshTrigger] = useState(0)

// Features
- Timer display with elapsed time
- Start/pause/resume/stop controls
- Manual time entry form (ManualEntry component)
- Today's session list with edit/delete

// Components used
- ManualEntry
- SessionItem
- Button (for controls)
```

### Projects Component Details
```typescript
// State managed
const { projects, refresh } = useProjects()
const [editingProject, setEditingProject] = useState<Project | null>(null)

// Features
- Create new project modal/form
- Edit existing project
- Delete project with confirmation
- Color picker for project color
- Archive/unarchive projects

// Form fields
- name: string (required)
- description: string (optional)
- color: string (hex color picker)
```

### Statistics Component Details
```typescript
// Data fetched
const { projects } = useProjects()
const entries = await fetchTimeEntries(userId)

// Calculations
- Monthly totals by project (groupSessionsByProject)
- Daily breakdown for last 7 days (getDailyBreakdown)
- Top 5 projects by time (for pie chart)

// Components used
- BarChart (daily breakdown)
- PieChart (top projects)
- Card (for chart containers)
```

---

## UI Components

Base presentational components used throughout the app.

| Component | Props | Purpose | Used In | File |
|-----------|-------|---------|---------|------|
| **Button** | `children`, `variant`, `onClick`, `disabled`, `type` | Styled button with variants (primary, secondary, danger) | All pages | `src/components/ui/Button.tsx` |
| **Card** | `children`, `className`, `title?` | Container for grouped content with optional header | Dashboard, Projects, Statistics | `src/components/ui/Card.tsx` |
| **Header** | `title`, `description?`, `action?` | Page header with title, optional subtitle, and action button slot | All pages | `src/components/ui/Header.tsx` |
| **StatCard** | `label`, `value`, `icon?`, `color?` | Metric display card (e.g., "Today: 2h 30m") | Dashboard | `src/components/ui/StatCard.tsx` |
| **EmptyState** | `message`, `action?` | Empty state message with optional CTA button | Dashboard, Timer, Projects | `src/components/ui/EmptyState.tsx` |
| **PageContainer** | `children` | Consistent page layout wrapper with padding/max-width | All pages | `src/components/ui/PageContainer.tsx` |

### Button Component
```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

// Variants
- primary: Blue background, white text
- secondary: Gray background, dark text
- danger: Red background, white text
- ghost: Transparent, text only

// Usage
<Button variant="primary" onClick={handleStart}>
  Start Timer
</Button>
```

### Card Component
```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

// Usage
<Card title="Recent Sessions">
  {sessions.map(s => <SessionItem key={s.id} entry={s} />)}
</Card>
```

### Header Component
```typescript
interface HeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;  // Slot for action button
}

// Usage
<Header
  title="Projects"
  description="Manage your project categories"
  action={<Button onClick={openCreateModal}>New Project</Button>}
/>
```

### StatCard Component
```typescript
interface StatCardProps {
  label: string;           // e.g., "Today"
  value: string;           // e.g., "2h 30m"
  icon?: React.ReactNode;
  color?: string;          // Tailwind color class
}

// Usage
<StatCard
  label="This Week"
  value={formatDuration(weeklyTotal)}
  color="text-blue-500"
/>
```

---

## Feature Components

Components specific to particular features.

| Component | Props | Purpose | Used In | File |
|-----------|-------|---------|---------|------|
| **SessionItem** | `entry`, `onEdit?`, `onDelete?`, `showProject?` | Display single time entry with project name, duration, time range | Dashboard, Timer, Statistics | `src/components/sessions/SessionItem.tsx` |
| **ManualEntry** | `onSubmit`, `projects` | Form to manually add time entry (start/end/break) | Timer | `src/components/timer/ManualEntry.tsx` |
| **BarChart** | `data`, `height?` | Daily time breakdown bar chart | Statistics | `src/components/charts/BarChart.tsx` |
| **PieChart** | `data`, `height?` | Project time distribution pie chart | Statistics | `src/components/charts/PieChart.tsx` |

### SessionItem Component
```typescript
interface SessionItemProps {
  entry: TimeEntry;
  onEdit?: (entry: TimeEntry) => void;
  onDelete?: (entryId: string) => void;
  showProject?: boolean;  // Show project name (default: true)
}

// Displays
- Project name and color badge
- Time range (e.g., "2:30 PM - 4:45 PM")
- Duration (e.g., "2h 15m")
- Description (if present)
- Edit/delete buttons (if callbacks provided)

// Usage
<SessionItem
  entry={session}
  onDelete={async (id) => {
    await deleteTimeEntry(id)
    refresh()
  }}
/>
```

### ManualEntry Component
```typescript
interface ManualEntryProps {
  onSubmit: (entry: Partial<TimeEntry>) => Promise<void>;
  projects: Project[];
}

// Form fields
- projectId: select dropdown
- description: text input (optional)
- startTime: datetime-local input
- endTime: datetime-local input
- breakDuration: number input (minutes)

// Validation
- endTime must be after startTime
- breakDuration cannot exceed total duration
- Calculates net duration = (end - start) - break

// Usage
<ManualEntry
  projects={projects}
  onSubmit={async (entry) => {
    await saveTimeEntry(entry)
    setRefreshTrigger(prev => prev + 1)
  }}
/>
```

### BarChart Component
```typescript
interface BarChartData {
  date: string;      // e.g., "2025-12-14"
  dayName: string;   // e.g., "Monday"
  totalTime: number; // seconds
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;  // px (default: 300)
}

// Features
- Responsive width
- Hover tooltips with formatted duration
- Y-axis with time labels (hours)
- X-axis with day names

// Usage
<BarChart
  data={getDailyBreakdown(entries, 7)}
  height={400}
/>
```

### PieChart Component
```typescript
interface PieChartData {
  projectId: string;
  projectName: string;
  projectColor: string;  // Hex color
  totalTime: number;     // seconds
  percentage: number;    // 0-100
}

interface PieChartProps {
  data: PieChartData[];
  height?: number;  // px (default: 300)
}

// Features
- Color-coded slices matching project colors
- Legend with project names and percentages
- Hover tooltips with duration

// Usage
<PieChart
  data={groupSessionsByProject(entries, projects).slice(0, 5)}
/>
```

---

## Layout Components

Components that structure the overall app layout.

| Component | Props | Purpose | Used In | File |
|-----------|-------|---------|---------|------|
| **Navigation** | None | Top navigation bar with logo, links, theme toggle | App.tsx (all pages) | `src/components/Navigation.tsx` (likely) |
| **PageContainer** | `children` | Consistent page wrapper with padding | All pages | `src/components/ui/PageContainer.tsx` |

### Navigation Component
```typescript
// Features
- Logo/app name
- Navigation links: Dashboard, Timer, Projects, Statistics, Settings
- Theme toggle button (dark/light/system)
- User menu with logout

// Responsive
- Mobile: Hamburger menu
- Desktop: Horizontal links
```

---

## Auth Components

Authentication guards and helpers.

| Component | Props | Purpose | Used In | File |
|-----------|-------|---------|---------|------|
| **ProtectedRoute** | `children` | Route guard that redirects to /login if not authenticated | App.tsx routing | `src/components/auth/ProtectedRoute.tsx` |

### ProtectedRoute Component
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Logic
1. Check useAuth() for user session
2. If loading: show loading spinner
3. If no user: redirect to /login
4. If authenticated: render children

// Usage (in App.tsx)
<Route path="/" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

---

## Component Dependency Graph

```
App.tsx
  └─ Navigation
  └─ ProtectedRoute
      └─ Dashboard
          ├─ Header
          ├─ StatCard × 4
          ├─ Card
          └─ SessionItem × N
      └─ Timer
          ├─ Header
          ├─ Button × 3
          ├─ ManualEntry
          └─ SessionItem × N
      └─ Projects
          ├─ Header
          ├─ Card × N
          └─ Button
      └─ Statistics
          ├─ Header
          ├─ Card × 2
          ├─ BarChart
          └─ PieChart
      └─ Settings
          ├─ Header
          ├─ Card
          └─ Button × 3
  └─ Login (public)
  └─ Signup (public)
```

---

## Common Component Patterns

### Pattern 1: Controlled Form Component
```typescript
// Components like ManualEntry
const [formData, setFormData] = useState({ ... })

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  await onSubmit(formData)
  setFormData(initialState)  // Reset after submit
}

return (
  <form onSubmit={handleSubmit}>
    <input value={formData.field} onChange={e => setFormData({ ...formData, field: e.target.value })} />
  </form>
)
```

### Pattern 2: List with Actions
```typescript
// Components like SessionItem with edit/delete
interface ItemProps {
  item: T;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
}

// Optional callbacks allow reuse
{onEdit && <Button onClick={() => onEdit(item)}>Edit</Button>}
{onDelete && <Button onClick={() => onDelete(item.id)}>Delete</Button>}
```

### Pattern 3: Empty State Handling
```typescript
// Pages check data length
{items.length === 0 ? (
  <EmptyState
    message="No items yet"
    action={<Button onClick={openCreateModal}>Create First Item</Button>}
  />
) : (
  items.map(item => <ItemComponent key={item.id} item={item} />)
)}
```

### Pattern 4: Loading State
```typescript
// Pages with data fetching
const { data, isLoading } = useDataHook()

if (isLoading) return <div>Loading...</div>

return <div>{/* Render data */}</div>
```

---

## Styling Conventions

### Tailwind Classes
- **Colors**: Use project.color for dynamic colors (badges, chart slices)
- **Spacing**: Consistent `gap-4`, `p-4`, `mb-4` throughout
- **Responsive**: Mobile-first with `md:` and `lg:` breakpoints
- **Dark Mode**: Use `dark:` variants for theme support

### Component Sizes
- **Buttons**: `h-10 px-4` (default), `h-8 px-3` (small)
- **Cards**: `p-6` (default), `p-4` (compact)
- **Icons**: `w-5 h-5` (default), `w-6 h-6` (large)

---

## When to Create a New Component

**Create new component when**:
- Logic is reused in 2+ places (DRY principle)
- Component exceeds ~200 lines (readability)
- Distinct responsibility (Single Responsibility Principle)

**Don't create component when**:
- Used only once and simple (<50 lines)
- Tightly coupled to parent logic
- Would require excessive prop drilling

**Example**: SessionItem is reused in Dashboard, Timer, and potentially Statistics → good component. A project color picker might be used only in Projects page → could be inline.

---

**Last Updated**: 2025-12-14
