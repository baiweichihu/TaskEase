# TaskEase Setup & Deployment Guide

This document covers installation, configuration, database setup, and deployment procedures.

## Table of Contents
1. [Development Environment](#development-environment)
2. [Supabase Configuration](#supabase-configuration)
3. [Database Initialization](#database-initialization)
4. [Local Testing](#local-testing)
5. [Production Deployment](#production-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Development Environment

### Prerequisites
- **Node.js:** 18.0.0 or higher
- **npm:** 9.0.0 or higher (comes with Node.js)
- **Git:** For version control
- **Text Editor:** VS Code recommended

### Installation

1. **Clone or download repository**
   ```bash
   git clone <repository-url>
   cd TaskEase
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   This installs all packages from `package.json`:
   - React 18.3.1
   - Vite 5.4.11
   - Bootstrap 5.3.8
   - Bootstrap Icons 1.13.1
   - Supabase JS client
   - And development tools

3. **Verify installation**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:5173` in your browser. You should see TaskEase homepage.

### Development Server
```bash
npm run dev
```
- Starts Vite dev server with hot module reloading (HMR)
- Changes to `.jsx` or `.css` files auto-refresh in browser
- Ctrl+C to stop

---

## Supabase Configuration

### Create Supabase Project

1. **Sign up / Login**
   - Visit https://supabase.com
   - Sign in with email/GitHub

2. **Create new project**
   - Click "New Project"
   - Name: `TaskEase` (or your preference)
   - Database password: Generate strong password (save this!)
   - Region: Choose your region (e.g., `us-west-1`)
   - Click "Create new project" and wait (5-10 minutes for setup)

3. **Get credentials**
   - Once project is ready, go to "Settings" → "API"
   - Copy:
     - `Project URL` → `SUPABASE_URL`
     - `anon public` key → `SUPABASE_KEY`

### Update TaskEase Configuration

1. **Open `src/App.jsx`**
   - Find lines ~4-5:
   ```javascript
   const SUPABASE_URL = "https://your-project.supabase.co";
   const SUPABASE_KEY = "your-anon-key";
   ```
   - Replace with your credentials from above

2. **Optional: Use environment variables**
   - Create `.env.local` in project root:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_KEY=your-anon-key
   ```
   - Update `src/App.jsx`:
   ```javascript
   const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
   const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
   ```

---

## Database Initialization

### Step 1: Enable Email Authentication

1. **In Supabase console, go to:** Authentication → Providers
2. **Verify "Email" is enabled**
   - Toggle should be ON (blue)
   - If OFF, click to enable

### Step 2: Run Migration Scripts

**Warning:** Only run these once per project. Running multiple times is safe but unnecessary.

#### 2a. Run Todos Table Migration

1. **In Supabase console, go to:** SQL Editor
2. **Create new query** (click "+ New Query")
3. **Copy and paste** contents of `supabase/todos_status_migration.sql`
4. **Click "Run"** and wait for completion (you should see "success" message)

**What this does:**
- Adds `status` column to `todos` table (default: 'pending')
- Backfills existing `completed` boolean to `status` values
- Adds `estimated_hours`, `ddl`, `priority`, `label`, `remark` columns
- Creates database indices for performance

#### 2b. Run User Preferences Table Creation

1. **Create another new query**
2. **Copy and paste** contents of `supabase/user_preferences.sql`
3. **Click "Run"** and wait for completion

**What this does:**
- Creates new `user_preferences` table
- Sets up RLS (Row-Level Security) policies
- Adds auto-update trigger for `updated_at` timestamp
- Creates index on `user_id` for query performance

### Step 3: Verify Tables

1. **In Supabase console, go to:** Table Editor
2. **Check that both tables exist:**
   - `todos` (should have new columns)
   - `user_preferences` (should be empty initially)

3. **Optional: Check RLS is enabled**
   - Click on each table
   - Check that RLS toggle is ON (blue)

---

## Local Testing

### Test 1: Guest Mode (No Login)

1. **Start dev server**
   ```bash
   npm run dev
   ```

2. **Visual inspection:**
   - Should show hero with live clock
   - "未登录，使用本地模式。" message visible
   - Can add/edit/delete tasks
   - Tasks persist in localStorage when you refresh

3. **Check localStorage:**
   - Open DevTools (F12)
   - Go to Application → Local Storage
   - Look for `taskease_todos_guest` key
   - Should contain task data

### Test 2: Registration & Login

1. **Click "登录" (Login) button**
   - Auth modal appears with Login/Register tabs

2. **Register new user**
   - Switch to "注册" tab
   - Username: `testuser123` (must be 3-32 chars)
   - Password: `password123` (must be >= 6 chars)
   - Confirm: `password123`
   - Click "保存" (Save)
   - Should see "注册成功。" message
   - Modal closes

3. **Login with new credentials**
   - Click "登录" again
   - Switch to "登录" tab (default)
   - Username: `testuser123`
   - Password: `password123`
   - Click "登录"
   - Should see "已登录用户 testuser123" at top-right

4. **Check Supabase**
   - In Supabase console → Table Editor → `profiles` table
   - Should see entry for `testuser123` with is_active = true

### Test 3: Task CRUD with Cloud Sync

1. **Add a task**
   - Click "添加任务" button
   - Fill form: title, estimated_hours, deadline, etc.
   - Click "保存"
   - Task appears in list

2. **Check Supabase**
   - In Supabase console → Table Editor → `todos` table
   - Should see your task with:
     - `user_id` matching logged-in user
     - `status` = 'pending'
     - Other fields matching form input

3. **Mark task as done**
   - Click checkbox on task item
   - Should toggle to done (crossed-out appearance)

4. **Delete a task**
   - Click delete (trash icon)
   - Task disappears from list
   - Verify in Supabase `todos` table (row deleted)

### Test 4: Theme Switching

1. **Click theme switcher (top-right)**
   - Sun icon → Light theme (cream colors)
   - Moon icon → Dark theme (charcoal colors)
   - Gear icon → System (follows OS setting)

2. **Verify persistence**
   - Change theme
   - Refresh page (F5)
   - Theme should remain (stored in localStorage)

3. **Check logged-in persistence**
   - Login with testuser123
   - Change theme to Dark
   - Change language to English
   - Refresh page
   - Login should persist AND preferences should persist

### Test 5: Language Switching

1. **Open Settings dropdown** (⚙️ icon)
2. **Click language selector**
   - Options: 简体中文, 繁體中文, English
3. **Select different language**
   - All UI text updates instantly
   - No page reload needed
4. **After login**, verify preferences persist across sessions

### Test 6: Error Handling

**Simulate Supabase unavailable:**
1. **Edit `src/App.jsx`, line ~4:**
   ```javascript
   const SUPABASE_URL = "https://invalid-url.supabase.co"; // Intentional wrong URL
   ```

2. **Reload page**
   - Login should fail (connection error)
   - Notice at top: "Supabase 未连接。"
   - Can still use local mode to add tasks

3. **Restore correct URL and test fallback:**
   - Set URL back to correct value
   - Clear browser cache
   - Supabase operations should work again

---

## Production Deployment

### Option 1: Vercel (Recommended)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial TaskEase deployment"
   git push origin main
   ```

2. **Visit https://vercel.com**
   - Sign up / Login
   - Click "Import Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure environment variables**
   - In Vercel dashboard → Project Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL` = your Supabase URL
     - `VITE_SUPABASE_KEY` = your Supabase anon key
   - Click "Save"

4. **Deploy**
   - Vercel deploys automatically
   - Visit provided URL (e.g., `taskease.vercel.app`)
   - Should see your app live

### Option 2: Netlify

1. **Push code to GitHub** (same as above)

2. **Visit https://netlify.com**
   - Sign up / Login
   - Click "Add new site" → "Import an existing project"
   - Select GitHub, authorize, choose repository

3. **Configure build settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Click "Deploy site"

4. **Add environment variables**
   - In Netlify dashboard → Site settings → Build & deploy → Environment
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_KEY`
   - Trigger redeploy

### Option 3: Manual Deployment (Traditional Host)

1. **Build production bundle**
   ```bash
   npm run build
   ```
   - Creates `dist/` folder with all HTML/JS/CSS

2. **Upload `dist/` folder contents**
   - Via FTP/SFTP to hosting provider
   - Via `npm` script (if configured)
   - Via cloud storage (AWS S3, etc.)

3. **Set up environment variables** in host's control panel
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY`
   - Or hardcode in `src/App.jsx` before build

4. **Configure DNS**
   - Point domain to hosting provider's IP/nameservers
   - Wait for propagation (5 minutes to 48 hours)

### Post-Deployment Verification

After deploying, test:

```bash
# 1. Visit your live URL
https://your-domain.com

# 2. Create test user
# - Register new account
# - Login
# - Add task
# - Check Supabase Table Editor (todos table should show new task)

# 3. Check theme/language persistence
# - Change to dark theme + English
# - Refresh page
# - Verify settings persist

# 4. Check performance
# - Open DevTools → Network tab
# - Check bundle sizes
# - Should be ~360KB JS (gzip ~104KB)
```

---

## Troubleshooting

### Issue: "Cannot find module '@supabase/supabase-js'"

**Solution:**
```bash
npm install @supabase/supabase-js
npm run dev
```

### Issue: Supabase connection fails with "Invalid API key"

**Solution:**
1. Verify `SUPABASE_URL` and `SUPABASE_KEY` in `src/App.jsx`
2. Double-check against Supabase console (Settings → API)
3. Ensure you're using the "anon" public key, not the "service" key

### Issue: "TypeError: todos.map is not a function"

**Cause:** `todos` is null or not an array
**Solution:**
1. Check Supabase URL/key are correct
2. Verify user is logged in before accessing todos
3. Open DevTools → Console and check for error messages

### Issue: Tasks not persisting after refresh

**Possible causes:**
1. **LocalStorage disabled in browser** → Enable in settings
2. **Supabase RLS misconfigured** → Verify RLS policies in Supabase console
3. **Wrong user_id in query** → Check browser's localStorage (`taskease_todos_guest` for guest mode)

**Solution:**
```javascript
// DevTools → Console, check:
localStorage.getItem('taskease_todos_guest')  // For guest mode
localStorage.getItem('taskease_lang')         // Check stored language
```

### Issue: Modal not appearing after click

**Solution:**
1. Check DevTools → Console for errors
2. Verify React dev tools show correct state (modal state should be `true`)
3. Ensure modal CSS is loaded (Bootstrap + custom styles)

### Issue: Dark theme colors not applying

**Solution:**
1. Verify browser CSS support (modern browsers should work)
2. In DevTools → Elements, check inline styles on main container
3. Verify `resolvedTheme` state is computed correctly (should be 'light' or 'dark')

### Issue: Language not switching instantly

**Solution:**
1. Check `TEXT` object in `src/App.jsx` contains all 3 languages
2. Verify `lang` state changes when language clicked
3. Check if component properly re-renders (use React DevTools Profiler)

### Issue: App crashes on Supabase login

**Solution:**
1. Open DevTools → Console, check error message
2. Verify `profiles` table exists in Supabase
3. Check RLS policies allow insert to `profiles` table
4. Verify email format `<username>@users.taskease.app` is valid

### Issue: Batch operations not working

**Solution:**
1. Click "批量选择" button to enter batch mode
2. Click task items to check/uncheck
3. Verify "标记完成" or "删除选中" buttons appear and are clickable
4. If buttons disabled: might be network issue (check Supabase status)

---

## Configuration Reference

### Environment Variables (`.env.local`)

```env
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key

# Optional (defaults to 24h if not set)
VITE_CLOCK_FORMAT=24h
```

### Build Configuration (`vite.config.js`)

```javascript
export default {
  plugins: [react()],
  // Vite serves static files from 'public/' folder
  // Configure if you have custom assets
}
```

### Application Constants (`src/App.jsx`)

Edit these lines if needed:
- **Line 3-5:** Supabase credentials
- **Line 6-8:** Table and domain names
- **Line 10-11:** Status codes (pending/done)
- **Line 13-16:** localStorage keys
- **Line 18+:** i18n TEXT object (translation strings)

---

## Next Steps

1. ✅ Development environment set up
2. ✅ Supabase project created and configured
3. ✅ Database tables initialized
4. ✅ Local testing completed
5. **→ Deploy to production**
6. **→ Monitor and maintain**

For detailed feature documentation, see [FEATURES.md](FEATURES.md).
For architecture details, see [ARCHITECTURE.md](ARCHITECTURE.md).
