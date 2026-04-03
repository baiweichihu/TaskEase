# TaskEase Architecture & Design

This document describes the overall architecture, code organization, design patterns, and data flows in TaskEase.

## Database Change Policy (For All AI Contributors)

- Database schema changes are allowed and expected when data becomes structured and long-lived.
- Do not store structured business data in `remark` or other text fields as hidden markers if a proper column should exist.
- If a feature needs durable fields, create a SQL migration in `supabase/` and update app read/write paths accordingly.
- Temporary compatibility parsing is acceptable only during migration windows, and must be removed after schema rollout.

Current explicit decision by project owner:
- It is always acceptable to modify database schema for correct design.
- "Cannot change schema" is not a valid reason for workaround implementations.

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Component Structure](#component-structure)
3. [State Management](#state-management)
4. [Data Flow](#data-flow)
5. [Storage Strategy](#storage-strategy)
6. [Authentication Flow](#authentication-flow)
7. [Theme System](#theme-system)
8. [Internationalization (i18n)](#internationalization-i18n)
9. [Database Schema](#database-schema)
10. [API Integration](#api-integration)
11. [Error Handling](#error-handling)
12. [Performance Considerations](#performance-considerations)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React App (src/App.jsx)                               │ │
│  │  ├─ State Management (13+ useState hooks)             │ │
│  │  ├─ UI Components (modals, filters, task list)        │ │
│  │  ├─ Event Handlers (CRUD operations)                  │ │
│  │  ├─ Effects (auth, theme, clock, preferences)        │ │
│  │  └─ localStorage API (guest mode, fallback)           │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Bootstrap + Bootstrap Icons (styling)                 │ │
│  │  Manrope font (typography)                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          ↓ (HTTP/HTTPS)
┌─────────────────────────────────────────────────────────────┐
│              Supabase (Backend-as-a-Service)               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Authentication (email + password)                     │ │
│  │  ├─ Magic links / password reset                      │ │
│  │  └─ Token-based session (JWT)                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Database                                   │ │
│  │  ├─ auth.users (user accounts)                        │ │
│  │  ├─ public.profiles (user metadata)                   │ │
│  │  ├─ public.todos (tasks)                              │ │
│  │  └─ public.user_preferences (settings)                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Row-Level Security (RLS) Policies                     │ │
│  │  ├─ Users can only read/write own data                │ │
│  │  └─ Admin policies for maintenance                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Technology Stack:**
- **Frontend:** React 18 (React Hooks), Vite (bundler)
- **UI Framework:** Bootstrap 5, Bootstrap Icons
- **Backend:** Supabase (PostgreSQL + Auth service)
- **Client Library:** @supabase/supabase-js
- **Build Tool:** Vite 5 with @vitejs/plugin-react

---

## Component Structure

### Single-Component Architecture

TaskEase consists of a **single React component** (`src/App.jsx`, ~800 lines):

```javascript
App.jsx
├─ Imports (React hooks, Supabase client, Bootstrap CSS)
├─ Constants (SUPABASE_URL, TABLE_NAMES, STATUS_CODES, etc.)
├─ TEXT object (internationalization strings for 3 languages)
├─ App function
│  ├─ State declarations (13+ useState hooks)
│  ├─ Effect hooks (theme, clock, preferences, auth)
│  ├─ Helper functions
│  │  ├─ notify() - Toast notifications
│  │  ├─ loadPreferences() - Load user settings
│  │  ├─ savePreferences() - Persist user settings
│  │  ├─ CRUD operations (add, update, delete tasks)
│  │  ├─ Auth handlers (login, register)
│  │  ├─ Batch operations
│  │  └─ Theme resolution
│  └─ JSX render (modals, hero, filters, task list)
└─ Export default App
```

**Design Rationale:**
- **Simplicity:** Single component easier to understand and debug
- **No prop drilling:** All state local to App
- **Rapid iteration:** Quick to modify and test
- **Future refactoring:** Can split into sub-components when codebase grows

---

## State Management

### State Variables (13+)

```javascript
// Language & Localization
const [lang, setLang] = useState('zh-CN');

// Theme & Display
const [themeMode, setThemeMode] = useState('system');  // user preference
const [resolvedTheme, setResolvedTheme] = useState('light');  // computed theme
const [clockFormat, setClockFormat] = useState('24h');
const [now, setNow] = useState(new Date());  // live clock

// Authentication
const [user, setUser] = useState(null);  // Supabase auth user
const [username, setUsername] = useState('');  // display name

// Modals
const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
const [isAddModalOpen, setIsAddModalOpen] = useState(false);
const [activeAuthTab, setActiveAuthTab] = useState('login');

// Auth form
const [loginUsername, setLoginUsername] = useState('');
const [loginPassword, setLoginPassword] = useState('');
const [registerUsername, setRegisterUsername] = useState('');
const [registerPassword, setRegisterPassword] = useState('');
const [registerConfirm, setRegisterConfirm] = useState('');

// Tasks
const [todos, setTodos] = useState([]);  // task array
const [filter, setFilter] = useState('all');  // active filter
const [batchMode, setBatchMode] = useState(false);
const [selectedIds, setSelectedIds] = useState(new Set());

// Add Task Form
const [draft, setDraft] = useState({
  title: '',
  estimated_hours: '',
  ddl: '',
  priority: 0,
  label: '',
  remark: ''
});

// Notifications
const [notice, setNotice] = useState({ msg: '', timeoutId: null });

// Settings
const [isSettingsOpen, setIsSettingsOpen] = useState(false);
```

### State Persistence

| State | Storage | Trigger | Duration |
|-------|---------|---------|----------|
| `lang` | localStorage (taskease_lang) | setLang + savePreferences | Session + persistent |
| `themeMode` | localStorage (taskease_theme_mode) | setThemeMode + savePreferences | Session + persistent |
| `clockFormat` | localStorage (taskease_clock_format) | setClockFormat + savePreferences | Session + persistent |
| `user` | Supabase auth session | Login/logout | Session only |
| `todos` | Supabase + localStorage | Add/update/delete | Persistent (cloud) |
| `username` | Memory (derived from user) | Login/logout | Session only |

---

## Data Flow

### Task Creation Flow

```
User Click "Add Task" Button
  ↓
Open AddTask Modal (isAddModalOpen = true)
  ↓
User fills form (title, hours, deadline, etc.)
  ↓
User clicks "Save"
  ↓
Validate form inputs
  ├─ Error? → Show error toast, stay in modal
  └─ Valid? → Continue
  ↓
If authenticated:
  ├─ Insert to Supabase todos table
  ├─ Error? → Rollback UI, show error toast
  └─ Success? → Continue
↓
Update local todos state
Update localStorage cache
Close modal
Show success toast
Reset draft form
```

### Task Update Flow

```
User clicks task "Edit" or completes task
  ↓
Update local state immediately (optimistic)
  ↓
If authenticated:
  ├─ Update Supabase todos row
  ├─ Error? → Rollback state, show error toast
  └─ Success? → Continue
↓
Update localStorage cache
Update UI to reflect new state
```

### Authentication Flow (Login)

```
User clicks "Login" button
  ↓
Open Auth Modal (isAuthModalOpen = true, activeAuthTab = 'login')
  ↓
User enters username + password
  ↓
User clicks "Login" button
  ↓
Validate inputs
  ├─ Invalid? → Show error in modal, stay
  └─ Valid? → Continue
  ↓
Call Supabase signInWithPassword(email, password)
  where email = "username@users.taskease.app"
  ↓
Supabase returns:
  ├─ Error? → Show in modal + toast
  └─ Success? → Get user object
  ↓
Store user in state (setUser)
Load user preferences from user_preferences table
Load user's todos from todos table
Close modal
Set username display
Show success toast
```

### Authentication Flow (Register)

```
User clicks "Register" tab
  ↓
User enters username + password + confirm
  ↓
User clicks "Register" button
  ↓
Validate inputs:
  ├─ Username format? (3-32 chars)
  ├─ Password length? (>= 6 chars)
  └─ Passwords match? (password == confirm)
  ├─ Any error? → Show in modal, stay
  └─ All valid? → Continue
  ↓
Check if username already exists (query profiles table)
  ├─ Exists? → Show error, stay
  └─ Available? → Continue
  ↓
Call Supabase signUp(email, password)
  where email = "username@users.taskease.app"
  ↓
Supabase returns:
  ├─ Error? → Show in modal
  └─ Success? → Continue
  ↓
Insert profile to profiles table
  (username, user_id from sign-up response)
  ↓
Show success toast "Registration successful"
Switch to "Login" tab
User logs in manually
```

---

## Storage Strategy

### localStorage (Client-side)

**Used for:**
- Guest mode (no authentication)
- Fallback during Supabase downtime
- Session persistence (auth tokens)
- User preferences (language, theme, clock)

**Keys:**
```javascript
taskease_todos_guest      // { id, title, status, ... }[] JSON
taskease_theme_mode       // 'light' | 'dark' | 'system'
taskease_lang             // 'zh-CN' | 'zh-TW' | 'en'
taskease_clock_format     // '12h' | '24h'
taskease_supabase_session // Supabase auth token (auto-managed)
```

**Limitations:**
- ~5-10MB per domain (browser-dependent)
- No encryption (store sensitive data with caution)
- Cleared when user clears browser cache
- No automatic sync across tabs/windows (polling would be needed)

### Supabase Database

**Used for:**
- Authenticated users' tasks (primary storage)
- User profiles (metadata)
- User preferences (language, theme, clock)
- Server-side validation, backups, analytics

**Advantages:**
- Centralized (access from any device)
- Persistent (survives app uninstall)
- Scalable (supports millions of rows)
- Row-Level Security (per-user data isolation)
- Automatic backups

**Disadvantages:**
- Network latency (50-500ms)
- Depends on internet connectivity
- Requires authentication setup

### Fallback Strategy

```
Try Supabase operation
  ↓
Success?
  ├─ Yes: Update localStorage cache + return
  └─ No: Catch error
    ↓
    Check error type
    ├─ Auth error? → Logout user, show error toast
    ├─ Connection error? → Show fallback message, use localStorage
    ├─ Other? → Show specific error, possibly rollback
    ↓
    For guest users:
      └─ Use only localStorage
    For authenticated users:
      ├─ Sync to localStorage immediately
      ├─ Show "云同步失败，已回退本地" toast
      └─ Next sync will push to Supabase (automatic retry)
```

---

## Authentication Flow

### Email Mapping

TaskEase maps usernames to synthetic emails for Supabase:

```javascript
// In app:
username = "alice"

// Sent to Supabase:
email = "alice@users.taskease.app"

// In Supabase profiles table:
{
  user_id: "uuid-from-auth",
  username: "alice",
  created_at: "2024-03-28T...",
  updated_at: "2024-03-28T..."
}
```

**Advantages:**
- No external email provider needed
- Predictable username ↔ email mapping
- Custom domain (taskease.app)

**Limitations:**
- Email is synthetic (not real address)
- Password reset requires backend setup
- Can't use standard "forgot password" flows

### Session Management

```
Login successful
  ↓
Supabase returns JWT + refresh token
  ↓
@supabase/supabase-js stores in localStorage automatically
  ↓
On app load, Supabase auto-restores session from localStorage
  ↓
User persists across page refreshes
  ↓
On logout
  ↓
Call supabase.auth.signOut()
  ↓
Supabase clears localStorage session
  ↓
App clears user state
```

---

## Theme System

### Theme Resolution Logic

```javascript
// User preference (stored in DB or localStorage)
const themeMode = 'system'; // 'light' | 'dark' | 'system'

// Compute actual theme
let resolvedTheme = 'light'; // default
if (themeMode === 'light') {
  resolvedTheme = 'light';
} else if (themeMode === 'dark') {
  resolvedTheme = 'dark';
} else if (themeMode === 'system') {
  // Check OS preference
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  resolvedTheme = isDark ? 'dark' : 'light';
}

// Apply to all UI elements
const colors = {
  light: {
    pageBg: '#f8eede',
    panelBg: '#efe3cb',
    listBg: '#faefdf',
    logoColor: '#333'
  },
  dark: {
    pageBg: '#1e2636',
    panelBg: '#2a3447',
    listBg: '#334159',
    logoColor: '#e0e0e0'
  }
};

const palette = colors[resolvedTheme];
```

### Color Palette Application

```javascript
// In JSX render:
<main style={{ backgroundColor: palette.pageBg, color: palette.logoColor }}>
  <section style={{ backgroundColor: palette.panelBg }}>
    {/* Hero section */}
  </section>
  
  <ul style={{ backgroundColor: palette.listBg }}>
    {/* Task list */}
  </ul>
</main>
```

### System Theme Listener

```javascript
// In useEffect:
const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

const handleThemeChange = (e) => {
  if (themeMode === 'system') {
    setResolvedTheme(e.matches ? 'dark' : 'light');
  }
};

darkModeQuery.addEventListener('change', handleThemeChange);

return () => darkModeQuery.removeEventListener('change', handleThemeChange);
```

---

## Internationalization (i18n)

### Text Object Structure

```javascript
const TEXT = {
  'zh-CN': {
    appTitle: 'TaskEase',
    settings: '设置',
    language: '语言',
    // ... 40+ keys
  },
  'zh-TW': {
    appTitle: 'TaskEase',
    settings: '設定',
    language: '語言',
    // ... 40+ keys
  },
  'en': {
    appTitle: 'TaskEase',
    settings: 'Settings',
    language: 'Language',
    // ... 40+ keys
  }
};

// Usage in component:
<h1>{TEXT[lang].appTitle}</h1>
```

### Dynamic Language Switching

```javascript
// In settings dropdown:
const handleLanguageChange = async (newLang) => {
  setLang(newLang);
  // Supabase updates automatically (in savePreferences effect)
  // localStorage updates automatically (in savePreferences effect)
  // UI re-renders immediately (React state updated)
};

// In useEffect (dependency on lang):
useEffect(() => {
  savePreferences(); // Persists new language
}, [lang, clockFormat, themeMode, resolvedTheme, user]);
```

### Translation Coverage

**Keys (40+):**
- Navigation: `appTitle`, `settings`, `login`, `logout`, `account`, `register`, `language`, `clockFormat`
- Modals: `addTask`, `close`, `save`, `invalidLogin`, `loginFailed`, `registerFailed`, `registerSuccess`
- Tasks: `all`, `active`, `done`, `markDone`, `deleteSelected`, `batchSelect`, `edit`, `remove`
- Status: `pendingSummary`, `pendingSuffix`, `noTask`, `allDone`
- Errors: `invalidUsername`, `shortPassword`, `passwordMismatch`, `usernameTaken`, `syncFallback`
- Metadata: `estHours`, `dueAt`, `priority`, `label`, `remark`, `weekdays` (array of 7)

---

## Database Schema

### todos Table

```sql
CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'done', 'blocked', 'cancelled')),
  completed BOOLEAN DEFAULT FALSE,  -- Legacy field
  estimated_hours NUMERIC(6,1) DEFAULT 0
    CHECK (estimated_hours >= 0 AND estimated_hours <= 999.9),
  ddl TIMESTAMPTZ,
  priority SMALLINT DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
  label TEXT,
  remark TEXT,
  repeat_rule TEXT NOT NULL DEFAULT 'none'
    CHECK (repeat_rule IN ('none', 'daily', 'weekly', 'monthly')),
  repeat_until_date DATE,
  progress_percent SMALLINT NOT NULL DEFAULT 0
    CHECK (progress_percent >= 0 AND progress_percent <= 100 AND MOD(progress_percent, 10) = 0),
  pomodoro_total_seconds INTEGER NOT NULL DEFAULT 0
    CHECK (pomodoro_total_seconds >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT todos_user_id_title_key UNIQUE (user_id, title)
);

CREATE INDEX idx_todos_user_id ON public.todos(user_id);
CREATE INDEX idx_todos_status ON public.todos(status);
CREATE INDEX idx_todos_ddl ON public.todos(ddl);
CREATE INDEX idx_todos_priority ON public.todos(priority);

-- RLS Policies
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY todos_select ON public.todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY todos_insert ON public.todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY todos_update ON public.todos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY todos_delete ON public.todos FOR DELETE USING (auth.uid() = user_id);
```

### user_preferences Table

```sql
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'zh-CN'
    CHECK (language IN ('zh-CN', 'zh-TW', 'en')),
  clock_format TEXT DEFAULT '24h'
    CHECK (clock_format IN ('12h', '24h')),
  theme_mode TEXT DEFAULT 'system'
    CHECK (theme_mode IN ('light', 'dark', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_user_preferences_updated_at();

-- RLS Policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_preferences_select ON public.user_preferences 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_preferences_insert ON public.user_preferences 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_preferences_update ON public.user_preferences 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY user_preferences_delete ON public.user_preferences 
  FOR DELETE USING (auth.uid() = user_id);
```

### profiles Table

```sql
-- Created by Supabase automatically on first sign-up
-- Can be customized to store additional user metadata

CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,  -- Synthetic email
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## API Integration

### Supabase Client Initialization

```javascript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
```

### Authentication Endpoints

**Sign Up:**
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'alice@users.taskease.app',
  password: 'password123'
});
// Returns: { user: { id, email }, session: { access_token, ... } }
```

**Sign In:**
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'alice@users.taskease.app',
  password: 'password123'
});
// Returns: { user, session }
```

**Sign Out:**
```javascript
const { error } = await supabase.auth.signOut();
```

**Get Session:**
```javascript
const { data: { session } } = await supabase.auth.getSession();
// Returns: { session: { user: {...}, ... } } or { session: null }
```

### Data Access Endpoints

**Insert Task:**
```javascript
const { data, error } = await supabase
  .from('todos')
  .insert({
    user_id: user.id,
    title: 'Buy milk',
    status: 'pending',
    estimated_hours: 0.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
```

**Fetch Tasks:**
```javascript
const { data, error } = await supabase
  .from('todos')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

**Update Task:**
```javascript
const { data, error } = await supabase
  .from('todos')
  .update({ status: 'done', updated_at: new Date().toISOString() })
  .eq('id', taskId)
  .eq('user_id', user.id);
```

**Delete Task:**
```javascript
const { data, error } = await supabase
  .from('todos')
  .delete()
  .eq('id', taskId)
  .eq('user_id', user.id);
```

**Fetch/Update User Preferences:**
```javascript
// Select
const { data: prefs } = await supabase
  .from('user_preferences')
  .select('*')
  .eq('user_id', user.id)
  .single();

// Upsert (insert or update)
const { data } = await supabase
  .from('user_preferences')
  .upsert({
    user_id: user.id,
    language: 'en',
    theme_mode: 'dark',
    clock_format: '12h'
  });
```

---

## Error Handling

### Error Types

| Type | Cause | Handling |
|------|-------|----------|
| Auth error | Wrong credentials, username taken | Show in modal, toast; clear form on retry |
| Network error | No internet, Supabase down | Fallback to localStorage, show toast |
| Validation error | Invalid input | Show toast, keep modal/form open |
| DB constraint error | Duplicate, foreign key | Show toast describing issue |
| Permission error (RLS) | Trying to access other user's data | Show generic error (shouldn't happen) |
| Unknown error | Unexpected crash | Log to console, show generic toast |

### Error Recovery

```javascript
// Generic error handler:
const handleError = (error, context) => {
  console.error(`[${context}]`, error);
  
  let message;
  if (error.status === 400) {
    message = 'Invalid input';
  } else if (error.status === 401) {
    message = 'Authentication failed'; // Re-login required
  } else if (error.status === 403) {
    message = 'Permission denied';
  } else if (error.status === 404) {
    message = 'Not found';
  } else if (error.status >= 500) {
    message = 'Server error, please try later';
  } else {
    message = 'An error occurred';
  }
  
  notify(message);
};
```

### Rollback Strategy

For optimistic updates:

```javascript
// Before updating UI:
const previousTodos = todos;

// Update UI immediately:
setTodos(newTodos);

// Try to sync:
try {
  await supabase.from('todos').update(...);
} catch (error) {
  // Rollback:
  setTodos(previousTodos);
  notify(TEXT[lang].updateRollback);
}
```

---

## Performance Considerations

### Bundle Size

**Vite production build:**
- HTML: 0.67 KB (gzip: 0.38 KB)
- CSS: 307.88 KB → 44.56 KB (gzip)
- JS: 360.14 KB → 104.05 KB (gzip)
- Bootstrap Icons font: 134 KB WOFF2 + 180 KB WOFF
- **Total**: ~500-600 KB uncompressed, ~150-200 KB gzip

**Optimization techniques:**
- Tree-shaking: Unused Bootstrap components excluded
- Code splitting: React + dependencies separate from app code
- Lazy loading: Icons loaded on-demand
- Minification: Vite minifies CSS/JS in production

### Rendering Performance

**Optimization strategies:**
- **Avoid unnecessary re-renders:** React.memo, useMemo, useCallback (not yet implemented but recommended)
- **Batch state updates:** Multiple setters can be combined using useReducer (future enhancement)
- **Virtual scrolling:** For long task lists (100+ items), consider react-window or react-virtualized
- **CSS-in-JS:** Inline styles (current approach) avoid CSS parsing overhead

### Network Performance

**API call optimization:**
- Load todo list once on login (not per filter change)
- Filter locally after loading (no new network request needed)
- Batch operations reduce number of round trips
- localStorage cache reduces Supabase queries on rehydration

**Latency targets:**
- Auth: 100-300ms (depends on network + Supabase region)
- Task load: 50-200ms
- Task add/update/delete: 50-150ms
- Theme/language changes: <16ms (instant, local state only)

---

## Security Considerations

### Data Protection

- **RLS Policies:** Every table has policies enforcing user isolation at DB level
- **Auth tokens:** Supabase JWT stored in localStorage (httpOnly option not available in localStorage)
- **Email masking:** Real emails hidden, synthetic addresses used instead
- **Password hashing:** Supabase handles via bcrypt

### Input Validation

- **Client-side:** Username 3-32 chars, password >= 6 chars, task titles required
- **Server-side:** Supabase checks constraints (NOT NULL, CHECKs, etc.)
- **SQL injection:** @supabase/supabase-js uses parameterized queries

### Best Practices

1. ✅ Never hardcode secrets in client code (use environment variables)
2. ✅ Always verify user owns data before allowing operations (enforced by RLS)
3. ✅ Validate inputs on both client and server
4. ✅ Clear auth tokens on logout (Supabase does automatically)
5. ⚠️ localStorage not encrypted (don't store credit cards, etc.)
6. ⚠️ Public API key exposed to client (acceptable as it's "anon" key with RLS)

---

## Deployment Architecture

### Development
```
Local machine
  ↓
npm run dev (Vite dev server)
  ↓
localhost:5173
```

### Production
```
GitHub repository
  ↓
Vercel / Netlify (CI/CD trigger)
  ↓
npm install && npm run build
  ↓
dist/ deployed to CDN
  ↓
https://taskease.example.com
  ↓
Browser downloads ~200 KB gzip
  ↓
Connects to Supabase API
```

---

## Future Roadmap

### Short-term (v1.1)
- [ ] Full task edit modal (currently prompt-based)
- [ ] Email verification for sign-ups
- [ ] Keyboard shortcuts (Esc, Enter)
- [ ] Search/filter by label

### Medium-term (v1.5)
- [ ] Real-time sync (Supabase subscriptions)
- [ ] Recurring tasks / templates
- [ ] Task dependencies / subtasks
- [ ] Analytics dashboard

### Long-term (v2.0)
- [ ] Collaborative tasks (team/sharing)
- [ ] Mobile app (React Native / Flutter)
- [ ] Desktop app (Electron)
- [ ] Browser extension
- [ ] Calendar integration
- [ ] AI-powered task suggestions

---

## Code Style & Conventions

### Naming
- `camelCase` for variables, functions, components
- `UPPERCASE` for constants
- `TEXT[lang].key` for all UI strings

### Formatting
- 2 spaces for indentation
- No semicolons at end of statements (optional in modern JS)
- Use template literals for strings with variables

Example:
```javascript
const MY_CONSTANT = 'value';

const myFunction = (param1, param2) => {
  const result = `${param1} + ${param2}`;
  return result;
};
```

### Comments
- Use `//` for inline comments
- Use `/* ... */` for multi-line comments
- Add comments for non-obvious logic (e.g., theme resolution, RLS reasoning)

---

End of Architecture Document
