# 构建与发布指南

本文档说明如何在 Windows 上从源码构建 TaskEase 桌面版。

---

## 一、前置条件

| 依赖 | 用途 | 是否必须 |
|---|---|---|
| **Node.js** 18+ | 前端构建与依赖管理 | ✅ 必须 |
| **Rust 工具链**（stable-x86_64-pc-windows-msvc） | 编译 Tauri 的 Rust 侧 | ✅ 必须 |
| **MSVC C++ 生成工具 + Windows SDK** | Rust 在 Windows 上的链接器 | ✅ 必须 |
| **Microsoft Edge WebView2 运行时** | 渲染界面 | ⚠️ Win11 全系自带，Win10 一般已随系统更新安装 |
| Git | 版本管理 | 建议 |

### 安装要点

**① Node.js** — 从官网安装即可。

**② MSVC C++ 生成工具** — 安装 [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)，勾选 **「使用 C++ 的桌面开发」** 工作负载（含 MSVC 编译器与 Windows SDK）。

这一步下载量较大（约 3-6 GB），但一次性投入。

**③ Rust 工具链**

```powershell
# 下载 rustup-init.exe 后静默安装
.\rustup-init.exe -y --default-toolchain stable-x86_64-pc-windows-msvc --profile minimal

# 把 cargo 加入 PATH（安装器默认不会自动改 PATH）
# 之后新开终端验证：
rustc -V
cargo -V
```

如需把工具链装到非系统盘（节省 C 盘空间），可先设置环境变量再安装：

```powershell
[Environment]::SetEnvironmentVariable('RUSTUP_HOME','D:\DevTools\rustup','User')
[Environment]::SetEnvironmentVariable('CARGO_HOME','D:\DevTools\cargo','User')
```

### 验证环境是否齐备

```powershell
node -v
rustc -V
# 确认 MSVC 工作负载已安装（有输出即说明齐全）
& "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe" `
  -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath

# 确认 WebView2 运行时已安装（有版本号输出即可）
Get-ItemProperty -Path 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}' |
  Select-Object -ExpandProperty pv
```

---

## 二、常用命令

```bash
npm install                 # 安装前端依赖

npm run dev                 # 浏览器开发（网页 demo 模式，数据存 localStorage）
npm run desktop:dev         # 桌面开发（热更新，数据存 SQLite）
npm run desktop:build       # 打包桌面版

npm test                    # 单元测试 + SQLite 集成测试
npm run test:watch          # 测试监听模式
npm run lint                # ESLint
npm run lint:fix            # ESLint 自动修复
npm run check:i18n          # 文案 key 双向一致性检查

npm run build               # 构建网页产物到 dist/
npm run build:pages         # 构建 GitHub Pages 用的产物（带 /TaskEase/ base）
npm run preview             # 预览网页产物
```

---

## 三、构建桌面版

```bash
npm run desktop:build
```

首次构建需要下载并编译 Rust 依赖，耗时较长（本机实测约 **3-4 分钟**，视机器而定）。
后续增量构建通常在 1 分钟以内。

### 产物

```
src-tauri/target/release/taskease.exe
    └─ 可直接运行的可执行文件

src-tauri/target/release/bundle/nsis/TaskEase_0.1.0_x64-setup.exe
    └─ NSIS 安装包（用户级安装，不需要管理员权限）
```

### 版本号

需要同时改三处（保持一致）：

| 文件 | 字段 |
|---|---|
| `package.json` | `version` |
| `src-tauri/tauri.conf.json` | `version` |
| `src-tauri/Cargo.toml` | `[package] version` |

---

## 四、发布流程

1. 更新上述三处版本号
2. `npm run desktop:build`
3. 在 GitHub 仓库创建 Release 并打 tag（如 `v0.1.0`）
4. 上传 `TaskEase_<版本>_x64-setup.exe`
5. （可选）后续接入 `tauri-plugin-updater` 后，可在 Release 中附带更新清单实现自动更新

### 关于代码签名

未签名安装包在用户双击时，Windows SmartScreen 会提示「未知发布者」。
个人自用可忽略；若要对外分发，需购买代码签名证书。

---

## 五、常见问题

### `link.exe not found` / 链接错误

MSVC 的 C++ 工作负载未安装或未装全。用上面 `vswhere` 命令确认，缺则回到 VS Installer 补装「使用 C++ 的桌面开发」。

### 构建很慢

Rust 发布构建启用了激进的体积优化（`lto` + `opt-level="s"` + `strip`），编译会更慢但产物更小。
调试期间可用 `npm run desktop:dev`（debug 构建，快得多）。

### 应用启动后是白屏

先用 `npm run desktop:dev` 启动，它会打开 devtools 并在控制台输出日志。
最常见原因是前端产物路径问题——确认 `vite.config.js` 中的 `base` 逻辑未被改坏。

### 想确认数据库文件在哪

```
%APPDATA%\com.baiweichihu.taskease\taskease.db
```

也可以在应用内「设置 → 数据与备份」导出备份，或直接复制该文件作为备份（复制前请关闭应用）。

### 想清理构建缓存释放磁盘

可以安全删除 `src-tauri/target/`（下次构建会重新生成，但需要重新编译全部 Rust 依赖，耗时较长）。

### 前端构建报 i18n 相关错误

运行 `npm run check:i18n`，检查是否有「被使用但未定义」的文案 key。

---

## 六、本机参考配置

以下为本项目开发机的实际配置，仅供对照：

| 项目 | 值 |
|---|---|
| Node.js | v24.13.0（`D:\NodeJS`） |
| npm | 11.6.2 |
| Rust | 1.98.1（`D:\DevTools\rustup` + `D:\DevTools\cargo`） |
| VS Build Tools 2022 | `C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools` |
| MSVC 工具集 | 14.44.35207 |
| Windows SDK | 10.0.26100.0 |
| WebView2 运行时 | 154.0.4258.37 |
