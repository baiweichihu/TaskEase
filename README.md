# TaskEase

**本地优先的任务管理与番茄钟桌面应用。** 数据全部保存在你自己的电脑上——无需账号、无需联网、不上传任何内容。

---

## 简体中文

### ✨ 这是什么

TaskEase 是一个 Windows 桌面应用（Tauri 2 + React），把「任务清单」和「番茄钟」两件事做扎实：

- **完全离线**：没有任何网络请求，首次启动即断网可用
- **无需账号**：单机单用户，没有注册登录那一套
- **数据是自己的**：存成一个 SQLite 文件，随时可备份、可带走
- **体积很小**：安装包约 2.4 MB，可执行文件约 5.2 MB

### 🎯 核心功能

| 功能 | 说明 |
|---|---|
| **任务管理** | 增删改查、完成/退回、优先级（0-10）、预估工时 |
| **丰富元数据** | 截止日期时间、标签、备注 |
| **重复任务** | 每天 / 每周 / 每月，支持「重复截止日期」与完成后自动生成下一次 |
| **截止倒计时** | 自动显示天/小时/分钟，不足 1 天时截止标签变红 |
| **智能排序** | 默认视图 / 截止排序 / 优先级排序 / 日历视图 |
| **日历视图** | 月历网格 + 当天任务侧栏，支持**拖拽任务到日期格**快速改期 |
| **番茄钟** | 计时、暂停继续、5 小时硬上限；会话记录可编辑时长、可删除 |
| **进度联动** | 番茄钟停止时按实际时长累加任务进度，与预估工时联动 |
| **自动规划** | 按可用时间窗口自动排布待办任务 |
| **数据统计** | 累计与最近一周的完成量、预估工时、番茄钟时长 |
| **主题** | 米黄配色，支持浅色 / 深色 / 跟随系统 |
| **多语言** | 简体中文 / English |
| **备份** | 一键导出/导入可读的 JSON 备份 |

### 💾 数据存放与备份

**数据库位置**（桌面版）：

```
%APPDATA%\com.baiweichihu.taskease\taskease.db
```

即 `C:\Users\<你的用户名>\AppData\Roaming\com.baiweichihu.taskease\taskease.db`。

数据库启用了 SQLite 的 **WAL 模式**，写入具备事务原子性——不会出现「写一半崩溃导致数据全丢」。

**备份方式二选一：**

1. **应用内导出**（推荐）：设置菜单 → **数据与备份** → 导出备份，得到一个可读的 JSON 文件
2. **直接复制文件**：把上面那个 `.db` 文件复制走即可（复制时请先关闭应用）

> ⚠️ 卸载应用时数据文件**不会**被自动删除。如需彻底清理，请手动删除该目录。

### 🚀 开发环境

```bash
npm install        # 安装依赖
npm run dev        # 浏览器里跑（网页 demo 模式，数据存 localStorage）
npm run desktop:dev   # 桌面窗口里跑（热更新，数据存 SQLite）
```

其他常用命令：

```bash
npm test           # 单元测试 + SQLite 集成测试
npm run lint       # ESLint
npm run check:i18n # 检查文案 key 是否有缺失或冗余
npm run build      # 构建网页产物到 dist/
```

### 📦 打包桌面版

```bash
npm run desktop:build
```

产物：

```
src-tauri/target/release/taskease.exe                              可执行文件
src-tauri/target/release/bundle/nsis/TaskEase_0.1.0_x64-setup.exe  安装包
```

本机构建环境的准备步骤见 [docs/BUILD.md](docs/BUILD.md)。

### 📋 项目结构

```
TaskEase/
├── src/
│   ├── App.jsx                  # 应用主体：状态、业务逻辑、界面编排
│   ├── main.jsx                 # 入口（含本地字体引入）
│   ├── styles.css               # 全局样式与字体栈
│   ├── planWork.js              # 自动规划算法
│   ├── components/              # 15 个界面组件
│   ├── storage/                 # 存储抽象层（桌面 SQLite / 网页 localStorage）
│   │   ├── index.js             #   按运行环境选择适配器
│   │   ├── sqliteAdapter.js     #   桌面实现
│   │   ├── webAdapter.js        #   网页实现
│   │   ├── sqlBuilders.js       #   纯函数 SQL 构造（有单测）
│   │   └── backup.js            #   备份导出/导入
│   ├── utils/                   # 纯逻辑工具（重复规则 / 番茄钟）
│   └── tests/                   # 测试
├── src-tauri/                   # Rust 侧（Tauri）
│   ├── src/lib.rs               #   插件注册、单实例锁、备份文件读写命令
│   ├── migrations/              #   数据库版本化迁移脚本
│   ├── capabilities/            #   权限清单
│   └── tauri.conf.json          #   应用配置
├── docs/                        # 文档
├── scripts/check-i18n.mjs       # 文案一致性检查
└── TODO.md                      # 迁移工作留痕（进度与决策记录）
```

### 🔐 隐私与安全

- **零网络请求**：应用不包含任何遥测、上报或外部 CDN 依赖（字体也已本地打包）
- **无凭据存储**：不存在账号密码，也就没有密码泄露风险
- **备份文件读写**：路径由系统「保存/打开」对话框给出，应用没有申请额外的文件系统权限
- **数据库权限**：仅授予 SQL 插件所需的 `load / select / execute / close`

### 📄 许可证

暂未指定开源许可证（All rights reserved）

---

## English

### ✨ What it is

**TaskEase** is a local-first desktop app for task management and Pomodoro tracking, built with Tauri 2 + React.

- **Fully offline** — no network requests at all; works from first launch with no internet
- **No account** — single user, single machine, no sign-up
- **Your data is yours** — stored as a single SQLite file you can copy or back up anytime
- **Small** — installer ≈ 2.4 MB, executable ≈ 5.2 MB

### 🎯 Features

| Feature | Description |
|---|---|
| **Task management** | Create / edit / delete / complete, priority (0-10), estimated hours |
| **Rich metadata** | Due date & time, labels, remarks |
| **Recurring tasks** | Daily / weekly / monthly, with an optional recurrence end date and auto-generation on completion |
| **Due countdown** | Auto-switches between days/hours/minutes; turns red when under one day remains |
| **Smart sorting** | Default / by due date / by priority / calendar view |
| **Calendar view** | Month grid with a day side panel; **drag tasks onto a date** to reschedule |
| **Pomodoro** | Timer with pause/resume and a 5-hour hard cap; session records are editable and deletable |
| **Progress linkage** | Stopping the timer accumulates real elapsed time into the task's progress |
| **Auto planning** | Fits pending tasks into an available time window |
| **Statistics** | All-time and past-week totals for completed tasks, estimated hours and Pomodoro time |
| **Themes** | Beige palette with light / dark / follow-system modes |
| **i18n** | Simplified Chinese / English |
| **Backup** | Export/import a readable JSON backup |

### 💾 Data location & backup

```
%APPDATA%\com.baiweichihu.taskease\taskease.db
```

SQLite runs in **WAL mode**, so writes are transactionally atomic.

**Two ways to back up:**

1. **In-app export** (recommended): Settings → **Data & Backup** → Export backup (readable JSON)
2. **Copy the file**: copy the `.db` file above (close the app first)

> ⚠️ Uninstalling does **not** delete your data. Remove the folder manually if you want a clean wipe.

### 🚀 Development

```bash
npm install
npm run dev           # runs in a browser (web demo mode, localStorage)
npm run desktop:dev   # runs in a desktop window (HMR, SQLite)
npm test              # unit tests + SQLite integration tests
npm run desktop:build # produces the installer and executable
```

Build prerequisites are documented in [docs/BUILD.md](docs/BUILD.md).

### 🔐 Privacy

- **Zero network requests** — no telemetry, no analytics, no external CDN (fonts are bundled locally)
- **No credentials** — there are no accounts, so no password risk
- The app requests only the SQL plugin permissions (`load / select / execute / close`)

### 📄 License

No open-source license specified yet (All rights reserved)
