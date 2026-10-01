# TaskEase 桌面版迁移 TODO

> 本文件是迁移工作的**唯一进度真源**，由 AI 助手维护，用于工作留痕。
> 每次动手前后都应更新对应条目的状态和工作日志。

---

## 一、已确认的项目决策

| # | 决策项 | 结论 |
|---|---|---|
| 1 | 目标形态 | **Windows 桌面应用**，使用 **Tauri 2**（不用 Electron） |
| 2 | Supabase | **完全移除**（账号体系、云同步、数据库全部删掉） |
| 3 | 多端同步 | **主动牺牲**，单机单用户 |
| 4 | 网页版定位 | **降级为 demo**（同一套代码，用构建开关产出两个产物） |
| 5 | 移动端 | Tauri 2 支持 Android/iOS，作为**未来可选路线**，本次不实现但**不堵死路** |
| 6 | 多语言 | **删除繁体中文**，保留简体中文 + 英文 |
| 7 | 主题 | **仅保留 `beige`（米黄）预设**；明暗模式保留 **浅色 / 深色 / 跟随系统** 三选 |
| 8 | 自定义背景图 | **删除**（含 `CustomBackgroundModal.jsx`） |
| 9 | 数据迁移 | **不做**。无真实用户、无历史数据，旧 localStorage 直接清空 |
| 10 | 数据导出功能 | **本次不做**，但在存储抽象层预留接口 |
| 11 | 安装目录 | 新增内容一律装到 **`D:\DevTools\`** |
| 12 | 核心功能 | **保持不变**（任务 / 日历 / 番茄钟 / 统计 / 重复任务 / 标签等） |

### 架构底线（为了让移动端路线保持可行）

1. 不使用 Tauri 桌面专属 API 污染业务层 —— 只允许出现在 `src/storage/` 适配器与入口文件
2. 不引入 Electron-only 写法（`require`、Node 内置模块等）
3. UI 保持响应式（Bootstrap 5 天然支持）

---

## 二、环境现状（2026-10-01 磁盘检查结果）

| 工具 | 状态 | 版本 / 位置 |
|---|---|---|
| Node.js | ✅ 已装 | `v24.13.0` @ `D:\NodeJS` |
| npm | ✅ 已装 | `11.6.2`（全局目录 / 缓存在 C 盘） |
| Git | ✅ 已装 | `2.53.0.windows.2` |
| WebView2 Runtime | ✅ 已装 | `154.0.4258.37`（C 盘系统组件，不可搬迁） |
| VS Build Tools 2022 | ✅ 已装 | `C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools` |
| ↳ MSVC C++ 编译器 | ✅ 已含 | `14.44.35207` |
| ↳ link.exe | ✅ 存在 | `...\MSVC\14.44.35207\bin\Hostx64\x64\link.exe` |
| ↳ Windows SDK | ✅ 已装 | `10.0.26100.0` |
| Rust / cargo / rustup | ❌ **待安装** | 目标：`D:\DevTools\` |
| Tauri CLI | ❌ **待安装** | 计划装为项目 devDependency |

**磁盘空间**：C 剩余 31.7 GB（偏紧） / D 剩余 354.9 GB（充足）

**例外说明（想搬也搬不走）**：
- VS Build Tools 已在 C 盘且工作正常，搬迁需卸载重装（几 GB + 30 分钟），**决定不动**
- WebView2 是系统级组件，**无法指定目录**
- 唯一会落 C 盘的是 `rustup-init.exe` 临时文件与注册表记录（可忽略）

---

## 三、量化进度

| 指标 | 改造前 | 当前 | 变化 |
|---|---|---|---|
| `src/App.jsx` 行数 | 4327 | **1925** | **-56%** |
| 构建 JS 体积 | 487.52 kB | 242.94 kB | **-50%** |
| 构建 JS gzip | 140.52 kB | 75.19 kB | **-46%** |
| `src/components/` 组件数 | 15 | 12 | -3 |
| 源码模块总数（不含测试） | — | 22（含新增 `src/storage/` 4 个） | — |
| 文案 key（每语言） | 220 | 152 | -31% |
| 自动化测试 | 4 文件 / 13 用例 | **6 文件 / 32 用例** | 覆盖面明显扩大 |
| `supabase/` SQL 脚本 | 28 | 0 | 全删 |
| 运行时依赖 | 5 | 4 | 移除 `@supabase/supabase-js` |
| 外部网络依赖 | Google Fonts CDN | **0** | 字体改为本地打包 |
| **数据存储** | 浏览器 localStorage | **SQLite 单文件（WAL）** | 具备事务原子性 |
| **数据物理位置** | C 盘 AppData | **C 盘 AppData**（沿用系统约定） | 无变化（曾改造后按要求撤销） |
| **桌面安装包体积** | 无 | **2.41 MB** | 对比 Electron 约 100 MB |
| **桌面可执行文件** | 无 | **5.19 MB** | `taskease.exe` |
| Rust 工具链体积（D 盘） | 无 | 758 MB | `D:\DevTools\` |
| **相对 HEAD 净代码量** | — | **-4154 行** | 42 文件，+610 / −4764 |

---

## 四、任务清单

### 阶段 0 · 留痕与基线 ✅
- [x] 创建本 TODO 文件
- [x] 基线验证：359 packages 安装完成；**测试 4 文件 / 13 用例全通过**；构建成功（JS 487.52 kB / CSS 311.88 kB）

### 阶段 1 · 断开 Supabase ✅
- [x] 移除硬编码凭证与 `buildSupabaseClient()`
- [x] 确认纯本地模式可用（**已用真实浏览器端到端验证**，见工作日志）
- [x] 旧 localStorage 无需清理（用户确认无历史数据）

### 阶段 2 · 存储抽象层 ✅ 已完成（数据已从 localStorage 迁到 SQLite）
- [x] 新建 `src/storage/` 接口层，收敛散落的 localStorage 调用
- [x] `src/storage/index.js`：按运行环境自动选择适配器（`__TAURI_INTERNALS__` 探测）
- [x] `src/storage/webAdapter.js`：网页 demo 用 localStorage
- [x] `src/storage/sqliteAdapter.js`：桌面版用 SQLite（`@tauri-apps/plugin-sql`）
- [x] `src/storage/sqlBuilders.js`：纯函数 SQL 构造器（多行 upsert / 分片 / 参数归一化）
- [x] Rust 侧注册 `tauri-plugin-sql`，用 `src-tauri/migrations/001_init.sql` 做版本化迁移
- [x] 加载态改造：`storageReady` 未就绪前不渲染主界面，从根上避免异步加载覆盖用户操作
- [x] 删除全部同步时代的遗留物：tombstone（墓碑）、`isCloudPomodoroSessionId`、`getPomodoroSessionsStorageKey`、`GUEST_*` 键、`getTaskLabelsStorageKey`
- [x] 用 `sessionsRef` 内存镜像替代「为了读当前列表再读一次磁盘」
- [x] 单元测试 `sqlBuilders.test.js`（11 例）+ 真实 SQLite 集成测试 `sqliteSchema.integration.test.js`（8 例）
- [x] 预留 `exportAll()` / `replaceAll()` 接口（导出/导入 UI 见阶段 7）
- [ ] 数据导出/导入 UI（下一步，底层接口已就绪）

### 阶段 3 · 拆除 Supabase 全部代码 ✅
- [x] 移除 `@supabase/supabase-js` 依赖
- [x] 移除 `createClient` 导入、`SUPABASE_*` 常量、`buildSupabaseClient()`、5 张表常量
- [x] 移除数据层：`loadTodosForUser` / `syncLocalPomodoroSessionsToCloud` / `loadPreferences` / `savePreferences` / `performCloudSync` / 云端墓碑 / `migrateLegacyPomodoroTotalsToSessions`
- [x] 移除认证层：`OtpModal` / `applySession` / `initSession` / `handleLogin` / `handleRegister` / `handleOtpVerify` / `handleLogout` / `handleResetPassword` / `handleUpdateUsername` / `loadOrCreateUsername` / `ensureProfile` / `isUsernameTaken`
- [x] 移除同步机制：自动同步定时器、`isSyncing`、`syncGuardRef`、`authSyncSeqRef`、`lastSyncAt`、`isTodoLocallyDirtyOrNew`、`withLockRetry`、`isTransientLockError`、`sleep`
- [x] 移除迁移流程：`isMigratePromptOpen` / `migrateLocalDataToCurrentUser` / 对应 ConfirmModal
- [x] 移除用户名缓存：`PENDING_USERNAME_*` / `USERNAME_CACHE_*` / `resolveFastUsername`
- [x] 彻底消除 `user` 状态与全部 `user?.id` 引用（代码变为诚实的「无账号」形态）
- [x] 修复 `readAllLocalTodos()` 跨 key 合并问题（函数已删除，改为只读当前 storageKey）
- [x] 删除组件 `AuthModal.jsx`、`ProfileSettingsModal.jsx`
- [x] 改造 `Header.jsx`：删掉登录/注册/登出、云同步按钮、自动同步开关、账号下拉
- [x] 删除 `supabase/` 目录（28 个 SQL 脚本）

### 阶段 4 · 按决策精简 ✅
- [x] 主题：删除 `pink` / `blue` / `lavender` 预设与 `custom-bg` 主题，仅留 `beige`；`getThemeColors(tone)` 简化为单配色
- [x] 主题：保留 `light` / `dark` / `system` 三选（已实测切换生效并持久化）
- [x] 删除 `CustomBackgroundModal.jsx` 及 `CUSTOM_BG_KEY` / `FileReader` / `isCustomBgTheme` / `customBackgroundStyle` 全部逻辑
- [x] i18n：删除 `TEXT["zh-TW"]` 整块（238 行）及所有 `zh-TW` 分支（App.jsx / TaskManager.jsx / Header.jsx）
- [x] 自动清理 75 × 2 = **150 行**已无引用的文案 key
- [x] 补齐缺失文案 key（`add` / `delete` / `themeLabel` / `themeLight` / `themeDark` / `themeSystem`），修复英文界面显示中文的缺陷
- [ ] 清理只服务于同步的字段（`local_dirty` / `local_updated_at`）—— 低优先级，无害

### 阶段 5 · 结构重构 ⏳ 待办
- [ ] `src/i18n/text.js`：把 `TEXT` 表从 App.jsx 抽出（约 300 行）
- [ ] 拆分 App.jsx（2100 行）：`useTodos` / `usePomodoro` / `useTheme` / `useTaskLabels` 等 hooks
- [ ] App.jsx 收敛为编排层（目标 ~300 行内）
- [ ] 更新 `vite.config.js`：支持 `VITE_BUILD_TARGET=desktop|web`

### 阶段 6 · Tauri 接入 ✅ 已完成
- [x] 新建 `D:\DevTools\`，设置 `RUSTUP_HOME` / `CARGO_HOME` 指向该目录（用户级永久环境变量）
- [x] 安装 Rust stable-x86_64-pc-windows-msvc（**rustc 1.98.1**），`D:\DevTools\cargo\bin` 加入用户 PATH
- [x] 项目内安装 `@tauri-apps/cli`（devDependency，落 D 盘）
- [x] `npx tauri init --ci` 初始化 `src-tauri/`
- [x] 配置 `tauri.conf.json`：正式 identifier、1280×860 窗口（最小 960×640、居中）、仅出 NSIS 包、用户级安装免 UAC
- [x] 配置 `Cargo.toml`：包名 `taskease`、lib 名 `taskease_lib`，发布构建启用 `lto` / `opt-level="s"` / `strip` / `panic=abort` 压缩体积
- [x] 字体本地化：`@fontsource/manrope` 替代 Google Fonts 外链；中文走系统字体栈（避免打包数 MB CJK 字体）
- [x] `vite.config.js` 自动识别 Tauri 构建（`TAURI_ENV_PLATFORM`）并使用相对路径 `base: "./"`
- [x] `package.json` 新增 `desktop:dev` / `desktop:build` / `check:i18n` 脚本
- [x] **成功产出安装包** `TaskEase_0.1.0_x64-setup.exe`（1.76 MB）与 `taskease.exe`（3.68 MB）
- [x] **运行时验证**：应用启动后创建标题为 `TaskEase` 的窗口、进程稳定存活（71.5 MB），WebView2 数据目录生成，LevelDB 中出现前端写入的 `taskease_lang` / `taskease_theme_mode` / `taskease_clock_format`
- [ ] 数据层从 localStorage 切到 Tauri Store / SQLite（归入阶段 2）

### 阶段 7 · 桌面特性 ✅ 本轮完成核心项
- [x] 应用图标：用 `public/favicon.svg`（Tauri CLI 原生支持 SVG 输入）生成了 Windows ICO + 各尺寸 PNG + Android mipmap
- [x] **单实例锁**：`tauri-plugin-single-instance`，重复启动不再开新窗口，而是把已有窗口唤到前台
- [x] **导出 / 导入备份 UI**：新增「数据与备份」弹窗，桌面走系统原生保存/打开对话框，网页走浏览器下载
- [x] ~~窗口尺寸 / 位置记忆~~（用户明确表示不需要）
- [x] ~~数据目录自定义~~（**已按用户要求撤销**，见下方说明）
- [ ] 系统托盘
- [ ] 开机自启（可选）
- [ ] 系统级通知
- [ ] 自动更新（tauri-plugin-updater + GitHub Release）

### 关于「数据目录」的决策反转（2026-10-01）

**先做的**：实现了三层数据目录解析（环境变量 → 用户指定 → 便携模式 → AppData 兜底）+ 自动搬家 + 「更改数据位置」按钮 + 便携版打包；并把 WebView2 缓存目录（实测 9.7 MB）也搬到数据目录旁，实现了 C 盘零占用。

**随后用户要求撤销**：理由是「如果不大的话，还是让它默认留在 C 盘，不要在程序层去改」——即倾向遵循 Windows 系统约定，避免为个人偏好增加程序复杂度。

**最终状态（已退回）**：
- 删除整个 `src-tauri/src/data_dir.rs` 模块与 `get_storage_info` / `set_data_dir` / `reveal_data_dir` 三个命令
- Rust 侧恢复为 `add_migrations("sqlite:taskease.db", ...)` 的相对路径，由框架按系统规范解析
- 窗口恢复由 `tauri.conf.json` 声明（不再用代码创建以指定 WebView 缓存目录）
- 删除 `scripts/make-portable.mjs`、`desktop:portable` 脚本、`dist-portable/` 产物与相关 `.gitignore` 条目
- 前端移除 `loadStorageInfo` / `changeDataDir` / `revealDataDir`，「数据与备份」弹窗只保留导出与导入
- 保留项：单实例锁、备份导出/导入、数据库迁移、存储抽象层

**实测确认退回干净**：数据库回到 `%APPDATA%\com.baiweichihu.taskease\taskease.db`，WebView2 缓存回到 `%LOCALAPPDATA%\...\EBWebView`，程序目录旁不再产生 `data` 文件夹。

### 阶段 8 · 出包与发版 ⏳ 待办
- [ ] `tauri build` 产出 `.exe` 安装包 + 免安装版
- [ ] 验证安装/卸载/数据持久化
- [ ] GitHub Release 发版流程

### 阶段 9 · 网页版降级为 demo ✅ 文档已重写
- [x] 移除网页版中的所有账号/同步入口（随阶段 3 一并完成）
- [x] **重写 `README.md`**：改为桌面版定位，删除全部 Supabase / 账号 / 云同步内容
- [x] **重写 `docs/ARCHITECTURE.md`**：描述当前 Tauri + React + SQLite 架构与关键决策
- [x] **新增 `docs/BUILD.md`**：构建环境准备、命令、发布流程、常见问题
- [x] **删除 6 份过时文档**：`SETUP.md` / `FEATURES.md` / `REFACTORING.md` / `PROJECT_UPDATE_v2.0.md` / `UI_UX_IMPROVEMENTS_v2.0.md` / `BEFORE_AFTER_COMPARISON.md`
- [x] **删除遗留数据文件** `pomodoro_sessions_rows.csv`（Supabase 时代的数据导出残留）
- [x] ~~演示版角标~~（用户明确表示不需要）
- [ ] 调整 GitHub Actions 仅构建 web 产物（如需保留网页 demo）

---

## 五、工作日志

### 2026-10-01

**勘察阶段**
- 完成仓库与 Git 历史勘察：28 次提交（2026-03-27 → 2026-04-15），全部由仓库主完成，之后停更约 5.5 个月；本地 HEAD `b2b87f1` 与远端一致
- 确认架构为 local-first：所有写操作先落 localStorage，Supabase 仅作为可选同步层
- 确认现有 4 个 vitest 测试文件（planWork / pomodoroProgress / pomodoroSessions / recurrence）
- 确认**不存在**数据导出/导入功能
- 确认项目**不存在环境变量**，Supabase 凭证硬编码在 `src/App.jsx` 第 438-439 行；`VITE_SUPABASE_URL` 仅存在于文档
- 完成磁盘工具链勘察；与用户确认 12 项决策；创建本 TODO 文件

**执行阶段（阶段 0-4 已完成）**
- 用子代理生成 App.jsx 的 Supabase 耦合结构地图（精确行号 + 删/留/改标记）
- 编写 `scripts/refactor-step1.mjs`：**带边界校验**的批量行删除。每段都要求起始行匹配预期标识符，任一不匹配即中止不写文件 → 首次 dry-run 命中 41/45，4 段因标记写在第二行而 MISS，核对结束行后确认范围正确，修正标记后执行
- step1 结果：App.jsx **4328 → 2864 行**（删除 1464 行）
- 用 eslint `no-undef` 驱动修复：32 个悬空引用 → 0
- 编写 `scripts/refactor-step2.mjs`：整块替换，把「云优先」实现改为「纯本地」实现
  - auth 会话监听 effect（159 行）→ 5 行本地初始化
  - `loadPomodoroTotalsForTodos` / `loadPomodoroSessions` 改为仅读本地
  - `storageKey` 固定为 `GUEST_KEY`
- 编写 `scripts/refactor-step3.mjs`：删除失效状态/常量/函数 + 全局消除 `user` 引用（18 组替换 + 16 段删除）→ **2578 行**
- 修正 `saveTaskLabels` 签名遗漏导致的 2 个 `userId` 未定义
- 编写 `scripts/refactor-step4.mjs`：删除 zh-TW 整块、多余主题预设、自定义背景逻辑 → **2282 行**
- 改写 `Header.jsx`：移除账号/同步 UI、繁体选项、调色板、自定义背景入口
- 删除 `AuthModal.jsx` / `ProfileSettingsModal.jsx` / `CustomBackgroundModal.jsx`；删除 `supabase/`（28 个 SQL）；卸载 `@supabase/supabase-js`
- 编写 `scripts/find-unused-i18n.mjs`：自动检测并清理 150 行无引用文案 → **2100 行**
- 编写 `scripts/check-i18n.mjs`（保留为长期维护工具）：检查「使用但未定义」与「已定义未引用」
- 修复 `check-i18n` 发现的 3 个我引入的缺失 key + 2 个历史遗留 key（`add` / `delete`，此前英文界面会显示中文）

**浏览器端到端验证（playwright-cli，均为真实 UI 操作）**
- 控制台 **0 error / 0 warning**
- 添加任务：填写标题 + 预计工时 → 提交 → 数据正确写入 `taskease_todos_guest`（且不再含 `user_id` 字段）
- 任务卡片渲染正确：预计任务时长 2.0 小时 / 进度 0%
- 刷新页面 → 数据持久化正常（1 条任务保留）
- 点击「完成」→ `status` 变为 `done`，进度 100%，剩余时长 0.0 小时，出现「退回」按钮
- 设置面板结构正确：语言（简 / Eng）、外观（浅色 / 深色 / 跟随系统）、时间制式（24h / 12h）、数据统计 / 番茄钟管理 / 管理标签 / 关于我们
- 主题切换：`data-bs-theme` 与 `localStorage.taskease_theme_mode` 均变为 `dark`，按钮高亮状态经程序化比对配色确认正确
- 语言切换：切到英文后 `localStorage.taskease_lang = en`，界面文案全部转为英文
- **日历视图**：渲染 42 个日期格、中文星期表头、月份导航、当天任务侧栏，深色主题适配正常
- 期间两次「日历没渲染」的误判，最终确认是命令行引号转义问题，**不是应用缺陷**

**最终验证**：lint 干净 / 测试 13 用例全通过 / 构建成功（JS 238.02 kB，gzip 73.41 kB）/ 控制台 0 错误

**阶段 6 · Tauri 接入**
- 建 `D:\DevTools\`，把 `RUSTUP_HOME` / `CARGO_HOME` 设为用户级永久环境变量，`rustup-init.exe` 下载至 D 盘并以 `--no-modify-path` 静默安装，手动把 `D:\DevTools\cargo\bin` 加入用户 PATH
- 安装结果：**rustc 1.98.1 / cargo 1.98.1**，工具链总体积 **758 MB，全部位于 D 盘**（符合用户「装到 D 盘」的要求）
- 项目内装 `@tauri-apps/cli` 2.12.1；`npx tauri init --ci` 生成 `src-tauri/` 骨架（含默认图标）
- 逐项调优配置：正式 identifier `com.baiweichihu.taskease`、窗口 1280×860（最小 960×640、居中）、bundle 只出 NSIS、`installMode: currentUser`（用户级安装，避免 UAC 弹窗）、Cargo 发布构建开启 `lto` + `opt-level="s"` + `strip` + `panic="abort"`
- **字体本地化**：接入 `@fontsource/manrope`（woff2 约 14 KB/字重），中文改用系统字体栈（微软雅黑 / 苹方等），彻底移除 Google Fonts 外链——桌面版首次启动即可完全离线渲染
- `vite.config.js` 通过 `TAURI_ENV_PLATFORM` 自动识别桌面构建并使用 `base: "./"`，网页版逻辑完全不受影响
- 首次 `tauri build`：Rust 依赖编译耗时 **3 分 40 秒**，NSIS 打包器自动下载
- 产物：`TaskEase_0.1.0_x64-setup.exe` **1.76 MB**、`taskease.exe` **3.68 MB**
- 启动验证：进程稳定运行（71.5 MB 工作集），窗口标题 `TaskEase`
- **运行时证据链**（不依赖截图）：`AppData\Local\com.baiweichihu.taskease\EBWebView` 生成 → WebView2 初始化成功；其 LevelDB 中出现 `taskease_lang=zh-CN`、`taskease_theme_mode=system`、`taskease_clock_format=24h`，这三项正是 React 应用挂载时写入的默认值 → **证明前端 JS 已在桌面端真实执行**；同时 `dist/index.html` 已确认使用 `./assets/...` 相对路径
- 说明：中途曾尝试整屏截图验证，发现抓到的是用户自己的浏览器画面，**出于隐私考虑立即删除并改用上述数据证据链**

**清理**：关闭浏览器与开发服务器，删除截图、eval 产物、`.playwright-cli/`、`.devserver.pid`；删除 4 个一次性重构脚本，仅保留 `scripts/check-i18n.mjs`

**阶段 7 · 应用图标**
- 用户指定复用 `public/favicon.svg`；经确认该 SVG 为方形（`viewBox 0 0 64 64`），米黄品牌渐变 + 深色对勾，风格与本应用主题一致
- Tauri CLI 的 `icon` 子命令**原生支持 SVG 输入**，无需先转 PNG，一条命令生成 Windows ICO / 各尺寸 PNG / Android mipmap 全套

**阶段 2 · 存储层落地为 SQLite（本轮最大改动）**
- 选型结论：**用 SQLite，不用 Python**。SQLite 是嵌入式的 C 语言库，不是 Python 专属；Tauri 通过 `tauri-plugin-sql`（底层 sqlx）直接使用。引入 Python 反而要额外打包运行时、增加 IPC 层，与「轻量化」目标相悖
- 存储抽象：`src/storage/` 四个模块 —— `index.js`（环境探测与适配器选择）、`webAdapter.js`（localStorage）、`sqliteAdapter.js`（SQLite）、`sqlBuilders.js`（纯函数 SQL 构造）
- Rust 侧：注册 `tauri-plugin-sql`，用版本化迁移 `src-tauri/migrations/001_init.sql` 建表（`todos` / `pomodoro_sessions` / `task_labels` / `app_meta` + 4 个索引）
- 数据库落盘位置：`%APPDATA%\com.baiweichihu.taskease\taskease.db`，自动启用 WAL 模式
- 竞态加固：新增 `storageReady` 门控 —— 持久层就绪前只显示加载态，从根本上杜绝「异步加载结果覆盖用户刚做的修改」
- 读写语义设计：任务用软删除所以只 upsert 不物理删；会话是物理删除，因此额外提供 `deleteSession(id)` 做精确删除
- 顺带清除了同步时代的最后一批残留：tombstone 墓碑机制、`isCloudPomodoroSessionId`、`getPomodoroSessionsStorageKey`、`getTaskLabelsStorageKey`、`GUEST_*` 一批键
- 改造过程中用 eslint 的 `no-undef` 作为「编译器」逐轮定位失效引用，最终 23 个错误全部收敛为 0；余下 5 个死代码警告一并清理

**存储层验证（分四层，逐层收紧）**
1. 静态检查：lint 0 问题；i18n 152 key 无缺失；构建成功
2. 单元测试 `sqlBuilders.test.js`（11 例）：占位符数量必须严格等于「行数 × 列数」、分片不丢数据、空值归一化（SQLite 不接受 `undefined`）
3. 集成测试 `sqliteSchema.integration.test.js`（8 例）：**用真实 SQLite 引擎（Node 内置 `node:sqlite`）加载真实迁移脚本建表**，再执行应用实际生成的 upsert SQL，验证 30 行批量写入、同 id 幂等更新、中文/引号/换行的参数化绑定（顺带验证无注入风险）、会话删除、标签覆盖写入
4. 端到端闭环：清空应用数据目录 → 启动应用 → 确认 `taskease.db` 被重新创建，且库内包含全部 4 张表、4 个索引与 `_sqlx_migrations` 迁移记录 → 再用脚本预置一条带标签的任务 → 启动应用 → 关闭后检查，`task_labels` 表中出现了应用派生写入的标签

> 第 4 项是关键：它证明桌面端**读写两个方向都真实贯通**（读：应用从 SQLite 读出预置任务；写：应用把标签写入 SQLite 文件），而不只是「能启动」。

**阶段 7 · 图标与关于页**
- 从 `favicon.svg` 生成全套图标，替换 Tauri 默认图标
- 关于弹窗新增「数据存储位置」展示（读 `storageKind` / `storageLocationHint`），并修正简介与特性列表（移除已不存在的「账号注册登录」条目）

**验证过程中的两次自我纠错（记录以便复现）**
- 「日历视图没渲染」误判：实为命令行引号转义问题，改用 `page.locator('[aria-label=views] button')` 后正常返回 42 个日期格
- 「桌面应用启动即退出」误判：实为首次冷启动（WebView2 初始化）导致的时间差，延长观察窗口后确认窗口正常、进程稳定

**阶段 7 · 单实例锁 / 数据位置 / 导入导出**
- **单实例锁**：接入 `tauri-plugin-single-instance`（必须第一个注册），重复启动时把已有窗口 `show + unminimize + set_focus`，避免两个窗口同时写同一个数据库
- **数据目录解析**（`src-tauri/src/data_dir.rs`，新增模块）：按 `TASKEASE_DATA_DIR` 环境变量 → 用户指定目录（`datadir.txt` 指针）→ **便携模式（程序目录可写时用 `<程序目录>\data\`）** → `%APPDATA%` 兜底 的顺序解析
- 「搬家」机制：目标目录还没有数据库、而其它候选目录有时，自动把 `taskease.db` 及 `-wal` / `-shm` 复制过去。因此「在设置里改位置」无需额外迁移流程，重启即生效
- **关键工程点**：数据目录必须在注册 SQL 插件**之前**解析好，因为插件用「连接串」作为迁移的键，前端必须用完全相同的连接串打开数据库。为此新增 `get_storage_info` 命令，前端启动时先取回连接串再 `Database.load`
- **C 盘零占用**：`tauri.conf.json` 改为不声明窗口，改由 `setup()` 中 `WebviewWindowBuilder::data_directory()` 构建，把 WebView2 的缓存与 localStorage（实测 9.7 MB）也搬到 `<数据目录>\.webview`
- **导入导出**：新增「数据与备份」弹窗（Header 设置菜单内）。桌面端走系统原生保存/打开对话框（文件读写由 Rust 命令 `write_backup_file` / `read_backup_file` 完成，因此不需要额外的文件系统权限）；网页端退化为浏览器下载与文件选择。导入前有二次确认，且 `parseBackup` 会在覆盖数据**之前**校验格式
- **便携版打包**：新增 `scripts/make-portable.mjs` 与 `npm run desktop:portable`，产出 `dist-portable/TaskEase/`（exe + 空 data 目录 + 使用说明），用户解压到 D 盘即用，数据天然在 D 盘

**本轮验证（全部实测）**
1. lint 0 问题 / i18n 175 key × 2 语言无缺失 / 构建成功
2. 测试 **7 文件 39 用例全通过**（新增 `backup.test.js` 7 例，覆盖备份解析与「格式非法时绝不写入」）
3. 便携模式：清空 C 盘与便携目录后启动，数据文件生成在 `dist-portable\TaskEase\data\`，库内 4 张表齐全
4. 单实例锁：第二次启动的进程立即退出，`taskease` 进程总数恒为 1
5. 更改数据位置：写入指针指向 `D:\DevTools\taskease-data` 后启动，数据库成功迁移到新目录
6. **C 盘占用**：`%LOCALAPPDATA%\com.baiweichihu.taskease`（原 WebView2 缓存 9.7 MB）**不再产生**；`%APPDATA%` 仅有一个**空文件夹**（0 字节、0 文件，是 Tauri 框架取配置路径的副作用），数据文件 100% 在 D 盘

**本轮：撤销数据位置改造 + 文档重写 + 文件清理**
- 按用户要求撤销全部自定义数据目录逻辑（详见阶段 7 的「决策反转」小节），退回后实测确认数据库与 WebView2 缓存均回到系统标准位置
- 重写 `README.md`、`docs/ARCHITECTURE.md`，新增 `docs/BUILD.md`
- 删除 6 份过时文档 + 1 个遗留数据文件
- 文案 key 从 175+ 回落到 169（随数据位置相关 UI 一并移除），无缺失、无冗余差异

**本轮：修复三个界面问题 + 清理同类本地化缺陷**

用户报告的三个问题：
1. 语言按钮「简」→「中」——`Header.jsx` 中是硬编码文字，直接改正
2. 添加任务 → 截止时间显示 `yyyy/mm/日`（中英混搭）
3. 「数据与备份」按钮与上方按钮的垂直间距不一致

**问题 2 的根因排查（做了对照实验）**
- 在 Chromium 中该占位符显示为 `年/月/日`（正常），但在 WebView2 中是 `yyyy/mm/日`
- 注入四组对照（`lang="zh-CN"` / `en` / `en-GB` / 不设 lang）→ **四组渲染结果完全一致**，说明 `lang` 属性无效；改文档 lang 的两张截图字节数也完全相同
- 结论：**占位文字由浏览器/WebView 的界面语言决定，页面完全无法控制**
- 因此改为：原生控件设为透明（`opacity: 0` + `pointer-events: none`）只当「选择器触发器」，显示文字由新增的 `DateInput` 组件按应用语言渲染；点击字段调用 `showPicker()` 弹出系统日历
- 同一组件替换了全部 3 处原生日期输入：截止日期、重复截止日期、番茄钟管理的日期筛选
- 实测：空状态显示「年/月/日」，选中后显示「2026/10/15」

**问题 3 的根因**：设置面板父容器是 `d-grid gap-3`（1rem），而该按钮在 `gap-2`（0.5rem）的子网格内 → 间距比其它行小一半。改为把它移出子网格、作为父容器的直接子元素，实测所有行间距统一为 16px。

**顺带清理的同类缺陷（同类「跟随系统语言而非应用语言」问题）**
排查全部 `toLocale*` 调用后，发现 3 处未显式指定语言，会在英文界面下显示中文格式（或反之）：
- `App.jsx` `toLocaleTimeString([], …)` —— 空数组即系统语言（番茄钟会话时间）
- `PlanWorkModal.jsx` `new Date(s.ddl).toLocaleString()`（自动规划结果里的截止时间）
- `AddTaskModal.jsx` `new Date(repeatPreviewIso).toLocaleString()`（重复任务下次预览）
做法：新增 `src/utils/locale.js` 提供 `getAppLocale(lang)`，并把 `locale` 作为 prop 传给相关组件；`TaskManager` 原有的等价逻辑也改为复用该函数，单一来源。
另修正一处时区隐患：番茄钟按日期筛选原本用 `new Date("YYYY-MM-DD")`（按 UTC 解析）再取本地日期做比较，在负时区会跨天；改为直接使用 `YYYY-MM-DD` 与新增的 `toLocalDateKey()` 比较。

**验证**：lint 0 问题 / i18n 170 key 无缺失 / 测试 7 文件全通过 / 构建成功
浏览器实测：语言按钮为 `["中","Eng"]`、按钮行间距统一 16px、日期字段空态与选中态显示均正确

**已提交并发布**
- 代码按语义拆成 3 个提交推送（`3cead51` 移除 Supabase / `fc2529c` 接入 Tauri / `733db16` 文档重写），其后补了 `48f5e15`（忽略 `.workbuddy/`）
- 打注释标签 `v0.1.0`，并用 GitHub CLI 创建 Release 附带安装包
- 发布地址：https://github.com/baiweichihu/TaskEase/releases/tag/v0.1.0
- 新增项目级 `.workbuddy/` 目录存放 AI 助手的工作记忆（含发布流程与踩坑记录），已加入 `.gitignore` 不参与仓库

**遗留说明**
- 所有改动**尚未提交 git**（工作区 40+ 个文件变动，可随时 `git checkout` 回滚；被删除的文档均存在于 git HEAD 中，可恢复）
- 本轮改动全在前端，**需重新执行 `npm run desktop:build` 才会进入 exe/安装包**
- `docs/` 与 `README.md` 仍含 Supabase 描述，留到阶段 9 统一重写
- 阶段 5（App.jsx 进一步拆分为 hooks）可作为最后一步；当前 1925 行已比原始 4327 行清爽得多
- 界面偏好（主题 / 语言 / 时间制式）仍存于 localStorage：它们体量极小、丢失成本极低，保留同步读取可避免首屏闪烁；任务与番茄钟等关键数据已全部落 SQLite
