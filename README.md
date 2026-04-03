# TaskEase

## 简体中文

**TaskEase** 是一个现代化的任务清单网页应用，采用 React + Vite + Bootstrap 技术栈，提供实时日期时间看板、任务筛选、日历管理、多语言支持与 Supabase 云同步功能。

### 🎯 核心特性

- **现代化技术栈：** React 18 + Vite 5 + Bootstrap 5 + Supabase
- **用户认证：** 用户名/密码注册登录（内部映射至 Supabase）
- **任务管理：** 添加、编辑、删除；丰富元数据（预估工时、截止日期、优先级、标签、备注、重复规则）
- **自适应主题：** 浅色/深色/跟随系统，主题切换自动应用所有区域
- **多语言支持：** 简体中文 / 繁体中文 / 英文，用户偏好持久化
- **实时时钟：** 每秒更新的日期时间看板
- **云端同步：** 本地优先操作，仅在手动/自动同步时与 Supabase 合并
- **日历管理：** 点击日期查看当天侧边详情，支持拖拽任务到日期格快速改期
- **重复任务：** 支持每天 / 每周 / 每月重复，完成后自动生成下一次任务
- **响应式设计：** Bootstrap 5 适配各类屏幕尺寸
- **富通知体验：** 顶部 Toast 通知条，错误/成功消息自动消失

### 🚀 快速开始

#### 前置要求
- Node.js 18+
- npm 或 yarn
- Supabase 项目（可选，不登录可离线使用）

#### 开发环境
```bash
# 安装依赖
npm install

# 启动开发服务器 (http://localhost:5173)
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

#### 部署步骤

1. **初始化 Supabase 表（首次部署）**
   ```bash
   # 在 Supabase SQL 编辑器中执行以下脚本
   supabase/todos_status_migration.sql      # 任务表迁移 + 新增字段
   supabase/user_preferences.sql            # 用户偏好表创建
   ```

2. **配置 Supabase 凭证**
   - 编辑 `src/App.jsx` 中的 `SUPABASE_URL` 和 `SUPABASE_KEY`
   - 或使用环境变量 `.env.local`

3. **构建和部署**
   ```bash
   npm run build
   # 部署 dist/ 文件夹到 Vercel、Netlify、GitHub Pages 等任意静态主机
   ```

4. **部署到 GitHub Pages（推荐：自动部署）**
   - 已内置 GitHub Actions 工作流：推送到 `main` 分支会自动构建并发布到 Pages。
   - 在 GitHub 仓库中进入 `Settings > Pages`。
   - `Build and deployment` 的 `Source` 选择 `GitHub Actions`。
   - 首次推送后，等待 `Actions` 中 `Deploy to GitHub Pages` 成功即可访问站点。

### 📋 项目结构

```
TaskEase/
├── src/
│   ├── App.jsx              # 主 React 组件（800+ 行）
│   └── main.jsx             # 应用入口
├── docs/
│   ├── FEATURES.md          # 详细功能文档
│   ├── SETUP.md             # 部署配置说明
│   └── ARCHITECTURE.md       # 架构设计
├── supabase/
│   ├── todos_status_migration.sql        # 任务表演变脚本
│   └── user_preferences.sql              # 用户偏好表脚本
├── dist/                    # 生产构建输出（git 忽略）
├── node_modules/            # 依赖包（git 忽略）
├── index.html               # HTML 模板
├── package.json             # 项目配置
├── vite.config.js           # Vite 配置
└── README.md                # 本文件
```

### 🔧 功能详情

详见 [docs/FEATURES.md](docs/FEATURES.md) 获取：
- 用户界面各部分详解
- 认证系统工作原理
- 数据库架构
- 主题系统设计
- 本地与云端存储策略
- 日历管理与拖拽改期
- 本地优先 + 同步合并策略（删除优先、偏好以本地为准）
- 重复任务自动续期
- 国际化实现

### 🗄️ 数据库

**Supabase 数据库包含两个主要表：**

1. **`todos`** - 任务表
   - 字段：id, user_id, title, status, estimated_hours, ddl, priority, label, remark, completed（向后兼容）, created_at, updated_at
   - 迁移脚本：`supabase/todos_status_migration.sql`
   - RLS 策略：用户只能访问自己的任务

2. **`user_preferences`** - 用户偏好表
   - 字段：user_id, language, clock_format, theme_mode, created_at, updated_at
   - 创建脚本：`supabase/user_preferences.sql`
   - RLS 策略：用户只能读写自己的偏好

### 🔐 安全特性

- **行级别安全（RLS）** - Supabase 强制用户隔离
- **认证令牌** - localStorage 存储会话，支持自动登出
- **密码安全** - Supabase 处理密码哈希和验证
- **离线安全** - 本地存储应用级加密（可选）

### 📱 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- 移动浏览器（iOS Safari, Chrome Mobile）

### 🎨 界面预览

- **顶部栏：** 主题切换 + 设置下拉菜单 + 登录按钮
- **中心看板：** 大号日期 + 实时时钟 + 任务统计
- **任务筛选：** 全部 | 进行中 | 已完成（黄色按钮）
- **任务列表：** 任务项卡片，支持完成/删除与快速编辑
- **日历视图：** 支持点击日期查看当天任务侧边详情，并可拖拽调整日期
- **特殊状态：** 所有任务完成时显示庆祝 emoji

### 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 📄 许可证

暂未指定开源许可证（All rights reserved）

---

## English

**TaskEase** is a modern task-list web application built with React + Vite + Bootstrap, offering a live date/time dashboard, task filtering, calendar management, multi-language support, and local-first data management with optional Supabase synchronization.

### 🎯 Key Features

- **Modern Stack:** React 18 + Vite 5 + Bootstrap 5 + Supabase
- **User Auth:** Username/password registration and login (mapped to Supabase)
- **Task Management:** Create, edit, delete; rich metadata (estimated hours, deadline, priority, label, remarks, repeat rule)
- **Adaptive Theme:** Light/dark/system modes; theme switches apply instantly across UI
- **Multi-Language:** Simplified Chinese / Traditional Chinese / English; user preferences persist
- **Live Clock:** Real-time date/time board updating every second
- **Cloud Sync:** Local-first operations; sync with Supabase only during manual/auto sync
- **Calendar Management:** Click a date to open side details and drag tasks to date cells for quick rescheduling
- **Recurring Tasks:** Daily / weekly / monthly recurrence with auto-next task generation on completion
- **Responsive Design:** Bootstrap 5 adapts to all screen sizes
- **Rich Notifications:** Toast notification bar at top; error/success messages auto-dismiss

### 🚀 Quick Start

#### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project (optional; works offline without login)

#### Development
```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

#### Deployment

1. **Initialize Supabase Tables (first-time only)**
   ```bash
   # Run the following scripts in Supabase SQL Editor:
   supabase/todos_status_migration.sql      # Task table evolution & new fields
   supabase/user_preferences.sql            # User preferences table creation
   ```

2. **Configure Supabase Credentials**
   - Edit `SUPABASE_URL` and `SUPABASE_KEY` in `src/App.jsx`
   - Or use environment variables in `.env.local`

3. **Build and Deploy**
   ```bash
   npm run build
   # Deploy dist/ folder to Vercel, Netlify, GitHub Pages, or any static host
   ```

4. **Deploy to GitHub Pages (recommended: automatic)**
   - This repo includes a GitHub Actions workflow that builds and deploys on pushes to `main`.
   - In your repository, open `Settings > Pages`.
   - Under `Build and deployment`, set `Source` to `GitHub Actions`.
   - After your first push, wait for `Deploy to GitHub Pages` to pass in `Actions`.

### 📋 Project Structure

```
TaskEase/
├── src/
│   ├── App.jsx              # Main React component (800+ lines)
│   └── main.jsx             # Application entry point
├── docs/
│   ├── FEATURES.md          # Detailed feature documentation
│   ├── SETUP.md             # Deployment and configuration guide
│   └── ARCHITECTURE.md       # Architecture and design patterns
├── supabase/
│   ├── todos_status_migration.sql        # Task table evolution script
│   └── user_preferences.sql              # User preferences table script
├── dist/                    # Production build output (gitignored)
├── node_modules/            # Dependencies (gitignored)
├── index.html               # HTML template
├── package.json             # Project configuration
├── vite.config.js           # Vite configuration
└── README.md                # This file
```

### 🔧 Feature Details

See [docs/FEATURES.md](docs/FEATURES.md) for comprehensive documentation including:
- User interface breakdown
- Authentication system details
- Database schema
- Theme system design
- Local and cloud storage strategy
- Calendar management with side details and drag rescheduling
- Local-first data flow with merge-on-sync (deletions take precedence; preferences use local values)
- Recurring task automation
- Internationalization implementation

### 🗄️ Database

**Supabase database contains two main tables:**

1. **`todos`** - Task table
   - Fields: id, user_id, title, status, estimated_hours, ddl, priority, label, remark, completed (backward compat), created_at, updated_at
   - Evolution script: `supabase/todos_status_migration.sql`
   - RLS Policy: Users can only access their own tasks

2. **`user_preferences`** - User preferences table
   - Fields: user_id, language, clock_format, theme_mode, created_at, updated_at
   - Creation script: `supabase/user_preferences.sql`
   - RLS Policy: Users can only read/write their own preferences

### 🔐 Security Features

- **Row-Level Security (RLS)** - Supabase enforces user isolation
- **Auth Tokens** - Session stored in localStorage with auto-logout support
- **Password Security** - Supabase handles hashing and verification
- **Offline Safety** - Local storage with optional app-level encryption

### 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

### 🎨 UI Preview

- **Header:** Theme switcher + settings dropdown + login button
- **Hero Dashboard:** Large date display + live clock + task statistics
- **Task Filters:** All | Active | Completed (yellow buttons)
- **Task List:** Task cards with complete/delete/edit actions
- **Calendar View:** Date grid with side panel and drag-to-date scheduling
- **Special State:** Celebration emoji when all tasks are done

### 🤝 Contributing

Issues and pull requests are welcome!

### 📄 License

No open-source license specified yet (All rights reserved)
