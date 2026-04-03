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
- **Middle:** View buttons (Default | Due Sort | Priority Sort | Calendar)
- **Right side:** Add Task + Auto Plan buttons

**Task List:**
- Expandable/togglable task items showing:
  - Title
  - Estimated hours (if set)
  - Due datetime (if set)
  - Priority level (0-10)
  - Label/tag (if set)
  - Repeat rule (if set)
  - Remarks/notes (if set)
- Empty state: "暂无任务" with uplifting message when all done: 🎉🎉🎉

**Special Elements:**
- **Toast notification bar** (top-fixed position, auto-dismisses after 4.5s): Error/success messages
- **Auth modal:** Two tabs (Login | Register) with validation
**Add Task Modal:** Full form with title, estimated hours, due datetime, priority, repeat rule, label, remarks

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
  
- **Profile Settings button** (visible when authenticated):
  - Opens independent modal for:
    - View bound email (read-only, shown at top)
    - Change username (1-15 characters, supports Chinese, symbols)
    - Reset password (email link sent)
  - Note: Email change functionality removed in v2.4
  
- **Data Statistics button** (visible when authenticated, NEW in v2.4):
  - Click to view task completion statistics
  - Shows two sections:
    - 📊 All-time stats: Total completed tasks + total hours spent
    - 📈 This week: Tasks completed in past 7 days + total hours spent
  
- **Logout button:**
  - Only visible when authenticated
  - Clears user session and reverts to guest mode
  - Confirmation optional (immediate logout)

### 2.3.1 Profile Settings Modal
Independent modal for authenticated users to manage their profile:
- **Bound Email (read-only):**
  - The currently bound account email is shown at the top of the modal
  - Display-only field; cannot be edited from this modal
- **Change Username:**
  - Input field with 15-character limit
  - Shows remaining characters counter
  - Validates: username must be 1-15 chars (any characters allowed)
- **Reset Password:**
  - Triggers password reset email link via Supabase
  - User follows email link to reset password
- **Note:** Email update functionality was removed in v2.4 per UX refinement

### 2.3.2 Data Statistics Modal (NEW in v2.4)
New modal to display user task completion analytics:
- **All-time Statistics:**
  - Total number of completed tasks
  - Total hours spent on completed tasks
- **This Week Statistics:**
  - Completed tasks in past 7 days
  - Total hours spent on this week's completed tasks
- **Presentation:**
  - Clean stat boxes with emoji indicators (📊 and 📈)
  - Responsive layout adapting to light/dark theme
  - Displays only completed (STATUS_DONE) tasks

### 2.4 Notification System (Enhanced in v2.4)
Unified Toast notification component for user feedback:
- **Visual Design:**
  - Top-center fixed position
  - Auto-dismisses after 4.5 seconds
  - Success messages: green background
  - Error messages: red background
- **Events Triggering Notifications:**
  - Login success
  - Task added / edited / deleted
  - Auto sync success (NEW in v2.4)
  - Auto sync started (via UI button)
  - Task edit success (NEW in v2.4)
  - Theme/language/preference changes
  - Migration success/failure
- **Consistency:**
  - All notifications use the same Toast.jsx component
  - Unified styling across the app
  - Consistent animation and timing

### 2.5 Reusable Modal Animation Shell (NEW in v2.5)
All major modal dialogs now share a reusable modal container component:
- **Component:** `ModalShell.jsx`
- **Unified behavior:**
  - Fade-in on open (backdrop + dialog)
  - Fade-out on close when clicking the top-right close icon
  - Same timing and animation curve across dialogs
- **Coverage:**
  - Auth, Add Task, Plan Work, Profile Settings, Data Statistics, About
  - Input/Confirm helper dialogs
  - OTP verification dialog
  - Diagnostic dialogs (network/database)

### 2.6 Task Data Model

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
| `repeat_rule` | TEXT | No | Recurrence rule: none/daily/weekly/monthly |
| `repeat_until_date` | DATE | No | Recurrence end date (inclusive) |
| `pomodoro_total_seconds` | INTEGER | No | Accumulated tracked seconds from timer |
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

### 2.7 Theme System

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

### 2.8 Internationalization (i18n)

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

### 2.9 Local + Cloud Storage Strategy

**Guest Mode (Not Logged In):**
- All todos stored in browser localStorage (key: `taskease_todos_guest`)
- No cloud sync
- Notice displayed: "未登录，使用本地模式。"
- Data persists only on current device/browser

**Authenticated Mode (Logged In):**
- Primary runtime storage: localStorage (local-first)
- Cloud storage: Supabase `todos` table (synced on demand)
- Sync strategy:
  1. Daily operations (add/edit/delete/complete) update localStorage immediately.
  2. Manual/auto sync uploads only locally changed rows (`local_dirty`) to Supabase.
  3. Deletions use local tombstone (`status=deleted`) and are deleted from cloud first during sync.
  4. Sync then pulls cloud data and merges back to local cache.
  5. User preferences are always pushed from local state to cloud during sync.

**Supabase Row-Level Security (RLS):**
- Users can only read/write/delete own todos (enforced at DB level)
- Attempts to access other user's todos rejected by Supabase

### 2.10 Task Operations

**Create (Add Task):**
- Opens modal with form: title, estimated_hours, ddl, priority, label, remark
- Validation: title required, estimated_hours >= 0, priority 0-10
- On save: Write to local storage immediately (cloud updated at sync time)
- Success: Task appears at top of list, modal closes
- Failure: Error toast, modal stays open

**Read (Display):**
- Restore local todos on app load (cloud is optional and merged during sync)
- Apply composed filters (All/Active/Done + multi-label filter)
- Render metadata: title, hours, deadline, priority, label, remark
- Live update: Changes from other sessions appear with socket/polling (optional future enhancement)

**Update (Edit):**
- Click edit → prompt for new title (quick edit, legacy method)
- Future: Full modal edit form (partially implemented, can be expanded)
- On save: Update local row immediately and mark it dirty for next sync

**Delete:**
- Click delete → local tombstone (`status=deleted`) so deleted items will not resurrect on sync
- During sync, deleted tombstones are physically deleted from cloud first

**Calendar Management:**
- Calendar view renders month grid with due-task badges on each day.
- Clicking a date opens a side panel that shows tasks for that day.
- Drag and drop supported:
  - Drag task to another calendar day to change date.
  - Drag task to a date cell to quickly reschedule its date.
- All drag operations reuse the same local-first update flow as task edits.

**Recurring Tasks:**
- Task form supports recurrence rule: none / daily / weekly / monthly.
- Current implementation persists recurrence in explicit columns: `todos.repeat_rule` and `todos.repeat_until_date`.
- Legacy remark markers are only parsed for compatibility during migration windows.
- Add task modal shows a live preview of the next generated occurrence time.
- Repeat validation is based on occurrence count (max 30), not fixed day-range.
- When a recurring task is marked done, the next occurrence is generated automatically.

### 2.11 Pomodoro Timer Integration
- The pomodoro timer records elapsed time from a start timestamp instead of relying on interval tick counts.
- Pause/resume uses accumulated seconds plus the current running segment, so background tab throttling will not lose actual time.
- Timer progress and tracked duration are written to `todos.pomodoro_total_seconds` and reflected in task progress.
- Task rows show a localized "Tracked / 已计时 / 已計時" label next to the timer button.
- If recorded pomodoro time exceeds the estimated duration, the task progress display is capped at 100%.

### 2.11.1 Data Statistics Split (Estimated vs Actual)
- Data stats modal now reports both:
  - Estimated duration sum (`estimated_hours`)
  - Actual pomodoro tracked duration (`pomodoro_total_seconds` converted to hours)
- Applies to both all-time and last-7-days sections.

Schema policy note:
- For structured feature data, this project prefers explicit database columns and migration scripts over hidden text markers.

### 2.12 Notifications

**Toast Bar (Top-fixed Position):**
- Auto-dismisses after 4.5 seconds
- Shows messages:
  - Login/registration errors
  - Sync failures with fallback status
  - Operation status (added task, deleted, etc.)
  - Connection warnings
  
**Implementation:** `notify(msg)` function sets state, schedules auto-dismiss timer

### 2.13 Modals

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
- `timerSession` (active pomodoro timer state, including accumulated seconds)
- `filter` (current filter: all/active/done)
- `isAuthModalOpen`, `isAddModalOpen` (modal visibility)
- `viewMode`, `calendarCursor`, `selectedDateKey` (calendar interaction state)
- `notice` (toast message and auto-dismiss timer)
- `local_dirty`, `local_updated_at` (per-task local change tracking for selective sync)

### 3.2 Performance
- Vite bundling: ~360KB JS (gzip ~104KB), ~44KB CSS (gzip)
- CSS shipped with Bootstrap icons: ~134KB WOFF2, ~180KB WOFF
- No excessive re-renders: React.memo, useMemo, useCallback strategies in place
- Local-first loading: restore local tasks instantly, then reconcile on sync

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
- [ ] Test task CRUD: add, update, delete
- [ ] Test calendar side-panel interactions and drag-to-reschedule
- [ ] Test recurrence rules (daily/weekly/monthly) and auto-next generation
- [ ] Test theme switching and language selection persistence
- [ ] Test fallback behavior (disable Supabase temporarily to verify localStorage)

## 6. Future Enhancements

- Full task edit modal (title, estimated_hours, ddl, priority, label, remark)
- Email verification flow for signups
- Recurring task templates
- Multi-label filtering in task list header (works with status filters)
- Keyboard shortcuts (Esc to close modals, etc.)
- Real-time sync via Supabase subscriptions
- Task analytics (productivity dashboard, time tracking)
- Subtasks / task dependencies
- Collaborative task sharing (multi-user teams)
