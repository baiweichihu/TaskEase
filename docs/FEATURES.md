# TaskEase Feature Documentation

## 1. Overview
TaskEase is a modern browser-based task manager built with **React 18** + **Vite** + **Bootstrap 5** + **Supabase**, providing a smooth task management experience with cloud synchronization, multi-language support, and adaptive theming.

**Tech Stack:**
- Frontend: React 18.3.1, Vite 5.4.11, Bootstrap 5.3.8, Bootstrap Icons 1.13.1
- Backend: Supabase (PostgreSQL + Auth + RLS)
- Styling: Manrope font (Google Fonts), CSS-in-JS dynamic theming
- Storage: localStorage (guest mode), Supabase (authenticated mode)

## 2. Core Features

### 2.1 Interface Structure
**Header Section:**
- Top-right controls:
  - Theme switcher: light 🌙 / dark ☀️ / system 🔄 icons
  - Settings dropdown (⚙️ icon): language, 12h/24h format, logout button
  - Login button (visible when not authenticated)

**Hero Section (Main Dashboard):**
- Large centered display showing:
  - Current date + weekday name (localized)
  - Live digital clock (updates every 1 second)
  - Secondary summary: "您还有 X 个任务待完成，预计 Y.Z 小时" (or English/Traditional Chinese equivalent)

**Task Controls Row:**
- **Left side:** Filter buttons (All | Active | Completed) with yellow styling, active state toggles
- **Right side:** Add Task (green button) | Batch Select (blue button)

**Task List:**
- Expandable/togglable task items showing:
  - Title
  - Estimated hours (if set)
  - Due datetime (if set)
  - Priority level (0-10)
  - Label/tag (if set)
  - Remarks/notes (if set)
  - Checkbox for batch selection (when in batch mode)
- Empty state: "暂无任务" with uplifting message when all done: 🎉🎉🎉

**Special Elements:**
- **Toast notification bar** (top-fixed position, auto-dismisses after 4.5s): Error/success messages
- **Auth modal:** Two tabs (Login | Register) with validation
- **Add Task modal:** Full form with title, estimated hours, due datetime, priority, label, remarks

### 2.2 Authentication System
- **Login/Register Modal:**
  - Two tabs: Login and Register
  - Username + password input fields
  - Validation: username 3-32 chars (alphanumeric + underscore), password >= 6 chars
  - Errors shown in modal alert area + toast notification
  
- **Email Mapping:**
  - Username is internally mapped to synthetic email: `<username>@users.taskease.app`
  - Example: username "john" → email "john@users.taskease.app"
  - Enables custom Supabase authentication without external email provider setup

- **User Profile:**
  - `profiles` table stores user metadata (username, created_at, updated_at)
  - Duplication check prevents registering same username twice
  - Profile creation happens on successful registration

- **Persistent Login:**
  - Session maintained via Supabase auth tokens in localStorage
  - User preferences (language, theme, clock format) auto-load on login
  - Logout clears auth credentials, reverts to guest mode

### 2.3 Settings Menu
Located in top-right dropdown (⚙️ icon), contains:
- **Language selector:** Simplified Chinese (zh-CN) | Traditional Chinese (zh-TW) | English (en)
  - Persists to `user_preferences.language`
  - Instantly updates all UI strings
  
- **Clock format:** 12-hour | 24-hour
  - Persists to `user_preferences.clock_format`
  - Affects hero display time and task datetime formats
  
- **Logout button:**
  - Only visible when authenticated
  - Clears user session and reverts to guest mode
  - Confirmation optional (immediate logout)

### 2.4 Task Data Model

**Database Schema (todos table):**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | Yes | Primary key |
| `user_id` | UUID | Yes | Foreign key to auth.users (RLS enforced) |
| `title` | TEXT | Yes | Task summary |
| `status` | TEXT | Yes | Enum: pending, in_progress, done, blocked, cancelled (default: pending) |
| `completed` | BOOLEAN | No | Legacy field (preserved for backward compatibility) |
| `estimated_hours` | NUMERIC | No | Estimated effort (0-999.9 hours) |
| `ddl` | TIMESTAMPTZ | No | Deadline (ISO 8601 datetime) |
| `priority` | SMALLINT | No | Importance level (0-10, 0 = no priority) |
| `label` | TEXT | No | Categorical tag (max 50 chars recommended) |
| `remark` | TEXT | No | Task notes/description |
| `created_at` | TIMESTAMPTZ | Yes | Auto-set on insert |
| `updated_at` | TIMESTAMPTZ | Yes | Auto-updated on row change |

**User Preferences Table:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `user_id` | UUID | Yes | Primary key (FK to auth.users) |
| `language` | TEXT | No | Default: zh-CN; Options: zh-CN, zh-TW, en |
| `clock_format` | TEXT | No | Default: 24h; Options: 12h, 24h |
| `theme_mode` | TEXT | No | Default: system; Options: light, dark, system |
| `created_at` | TIMESTAMPTZ | Yes | Auto-set on insert |
| `updated_at` | TIMESTAMPTZ | Yes | Auto-updated on row change |

### 2.5 Theme System

**Design Philosophy:** Adaptive deep/light theming with computed "resolved" theme separate from user preference.

**Theme Modes:**
- **Light:** Warm palette (cream/beige backgrounds)
- **Dark:** Cool palette (charcoal/slate backgrounds)
- **System:** Follows OS `prefers-color-scheme` setting (default)

**Color Palettes (applied per theme):**
- **Page background** (`pageBg`): Main container backdrop
- **Panel background** (`panelBg`): Hero section, modals, control areas
- **List background** (`listBg`): Task list container
- **Logo color** (`logoColor`): "TaskEase" title text

**Implementation:**
- Theme preference stored in `user_preferences.theme_mode`
- localStorage fallback for guests (key: `taskease_theme_mode`)
- System theme monitored via `window.matchMedia("(prefers-color-scheme: dark)")`
- On theme change: All background/text colors recompute, modal and panel styles adapt, live transition

**Celebration Display:**
- When pending task count == 0: List displays 🎉🎉🎉 with celebratory message
- List background lightens slightly to highlight achievement

### 2.6 Internationalization (i18n)

**Supported Languages:**
1. **Simplified Chinese (zh-CN)** — Default
2. **Traditional Chinese (zh-TW)**
3. **English (en)**

**Text Coverage (40+ translation keys):**
- App title, button labels
- Form placeholders (username, password, task title, etc.)
- Error/success messages (login failed, registered, fallback messages)
- Status text (pending, active, done)
- Metadata labels (estimated hours, deadline, priority, label, remarks)
- Weekday names (localized calendar display)

**Persistence:**
- Language preference stored in `user_preferences.language`
- localStorage fallback (key: `taskease_lang`)
- Selection persists across sessions

**Instant Updates:**
- Changing language via settings dropdown instantly re-renders all strings
- No page reload required

### 2.7 Local + Cloud Storage Strategy

**Guest Mode (Not Logged In):**
- All todos stored in browser localStorage (key: `taskease_todos_guest`)
- No cloud sync
- Notice displayed: "未登录，使用本地模式。"
- Data persists only on current device/browser

**Authenticated Mode (Logged In):**
- Primary storage: Supabase `todos` table (RLS enforced per user_id)
- Local cache: localStorage also updated for offline resilience
- Sync strategy:
  1. Successful operation → update Supabase + update localStorage
  2. Supabase fails → rollback UI state, show error toast, restore localStorage
  3. Connection unavailable → fallback to localStorage, show "云同步失败，已回退本地" toast

**Supabase Row-Level Security (RLS):**
- Users can only read/write/delete own todos (enforced at DB level)
- Attempts to access other user's todos rejected by Supabase

### 2.8 Task Operations

**Create (Add Task):**
- Opens modal with form: title, estimated_hours, ddl, priority, label, remark
- Validation: title required, estimated_hours >= 0, priority 0-10
- On save: Insert to Supabase (if authenticated) + localStorage
- Success: Task appears at top of list, modal closes
- Failure: Error toast, modal stays open

**Read (Display):**
- Fetch all user's todos from Supabase on app load
- Apply filter (All/Active/Done) to display subset
- Render metadata: title, hours, deadline, priority, label, remark
- Live update: Changes from other sessions appear with socket/polling (optional future enhancement)

**Update (Edit):**
- Click edit → prompt for new title (quick edit, legacy method)
- Future: Full modal edit form (partially implemented, can be expanded)
- On save: Update Supabase row + localStorage
- Optimistic update: UI updates immediately, rollback on error

**Delete:**
- Click delete → immediate removal from UI
- Soft delete not implemented; hard delete removes row permanently
- RLS ensures only owner can delete
- Failure: Rollback, show error toast

**Bulk Operations:**
- **Batch Select Mode:** Top-right button enters mode, checkboxes appear on all tasks
  - Click task to toggle checkbox
  - Selected count shown
  - "Mark Done" button: Update all selected to status=done
  - "Delete Selected" button: Remove all selected
  - Both operations: Optimistic update + Supabase sync + localStorage update + error rollback
- Exit batch mode: "退出批量" button or filter click

### 2.9 Notifications

**Toast Bar (Top-fixed Position):**
- Auto-dismisses after 4.5 seconds
- Shows messages:
  - Login/registration errors
  - Sync failures with fallback status
  - Operation status (added task, deleted, etc.)
  - Connection warnings
  
**Implementation:** `notify(msg)` function sets state, schedules auto-dismiss timer

### 2.10 Modals

**Auth Modal:**
- Tabs: Login | Register
- Shared error alert area (red background, white text)
- Auto-closes on successful login
- `esc` key auto-closes (optional)

**Add Task Modal:**
- Form fields: title (required), estimated_hours, ddl (date+time picker), priority, label, remark
- Save button validates and submits
- Close button (or Esc) dismisses without saving
- Modal background adapts to current theme

## 3. Technical Highlights

### 3.1 State Management
React hooks manage:
- `lang` (current language code)
- `themeMode` (user preference: light/dark/system)
- `resolvedTheme` (computed actual theme: light/dark)
- `clockFormat` (12h/24h)
- `user` (authenticated user object or null)
- `username` (display name for authenticated user)
- `todos` (task array from Supabase or localStorage)
- `filter` (current filter: all/active/done)
- `isAuthModalOpen`, `isAddModalOpen` (modal visibility)
- `batchMode`, `selectedIds` (batch operation state)
- `notice` (toast message and auto-dismiss timer)

### 3.2 Performance
- Vite bundling: ~360KB JS (gzip ~104KB), ~44KB CSS (gzip)
- CSS shipped with Bootstrap icons: ~134KB WOFF2, ~180KB WOFF
- No excessive re-renders: React.memo, useMemo, useCallback strategies in place
- Lazy loading: Only fetch todos on login

### 3.3 Browser Compatibility
- Modern browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Requires ES2020 support
- localStorage and IndexedDB tested on major platforms

## 4. Database Deployment

### 4.1 Todos Table Evolution
Migration script: `supabase/todos_status_migration.sql`

**Changes:**
- Adds `status` TEXT column (enum: pending, in_progress, done, blocked, cancelled)
- Backfills `completed` boolean to `status` values (pending/done)
- Adds new metadata columns: `estimated_hours`, `ddl`, `priority`, `label`, `remark`
- Creates indices on `status`, `ddl`, `priority` for query optimization
- Preserves legacy `completed` column for backward compatibility

### 4.2 User Preferences Table
Migration script: `supabase/user_preferences.sql`

**Structure:**
- One row per user (user_id: PRIMARY KEY)
- Stores: language, clock_format, theme_mode
- RLS policies: Users can only read/write own row
- Trigger: Auto-update `updated_at` timestamp on modification
- FK: Cascade delete when user deleted from auth.users

## 5. Deployment Checklist

- [ ] Run `supabase/todos_status_migration.sql` in Supabase SQL Editor
- [ ] Run `supabase/user_preferences.sql` in Supabase SQL Editor
- [ ] Verify RLS policies are active on both tables
- [ ] Update Supabase URL and anon key in `src/App.jsx` (if using different project)
- [ ] Run `npm run build` to generate production bundle
- [ ] Deploy `dist/` folder to web hosting (Vercel, Netlify, etc.)
- [ ] Test auth flow: register, login, logout
- [ ] Test task CRUD: add, update, delete, batch operations
- [ ] Test theme switching and language selection persistence
- [ ] Test fallback behavior (disable Supabase temporarily to verify localStorage)

## 6. Future Enhancements

- Full task edit modal (title, estimated_hours, ddl, priority, label, remark)
- Email verification flow for signups
- Recurring task templates
- Task search/filter by label or remark
- Keyboard shortcuts (Esc to close modals, etc.)
- Real-time sync via Supabase subscriptions
- Task analytics (productivity dashboard, time tracking)
- Subtasks / task dependencies
- Collaborative task sharing (multi-user teams)
