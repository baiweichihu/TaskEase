# TaskEase 更新日志 - 2026-04-11

## 🐛 Bug 修复

### 番茄钟重复记录问题
**问题描述：** 用户完成一次番茄钟计时后，数据库中会生成两条几乎相同的记录，两条记录的 `start_time` 略有差异，但 `task_id`, `duration_seconds` 完全相同。

**根本原因：**
1. `PomodoroTimer.commitSession()` 在关闭计时器时同时触发两个回调：`onPersistSession` 和 `onStop`
2. 两个回调分别调用不同的保存函数：`persistPomodoroSession()` (更新累计时长) 和 `persistPomodoroSessionRecord()` (创建新记录)
3. 时间戳计算使用不精确的数学运算，导致毫秒级别差异，使数据库查重失效

**修复方案：**
- ✅ 修改 `commitSession()` 逻辑：关闭计时器时仅调用 `onStop`，不调用 `onPersistSession`
- ✅ 改进 `persistPomodoroSessionRecord()` 时间计算：采用统一的 end_time + duration 公式，四舍五入至秒级
- ✅ 添加本地重复检查：在保存前检查是否存在相同任务、相同时长、start_time 在±2秒内的记录
- ✅ 改进数据库同步逻辑：使用更精确的查询条件识别已存在的记录

**影响范围：**
- `src/components/PomodoroTimer.jsx` - `commitSession()` 函数
- `src/App.jsx` - `persistPomodoroSessionRecord()` 和 `handleStopTimer()` 函数

---

## ✨ 新功能

### 任务标签管理 (Task Labels Manager)
**功能概述：** 用户现在可以创建和管理自定义标签，用于组织和分类任务。

**访问方式：** 
- 设置菜单 → **管理标签** 按钮
- 位置：位于"数据统计"和"个人设置"之间

**功能特性：**
- 📝 添加新标签
  - 验证非空、长度≤20字符、无重复
  - 实时错误提示
- ✏️ 编辑现有标签：选中后可修改内容
- 🗑️ 删除标签：带确认样式
- ⌨️ 键盘快捷键：Enter 确认，Esc 取消

**国际化支持：** 完整支持三语言
- 简体中文 (zh-CN)
- 繁體中文 (zh-TW)
- English

**主题适配：** 支持所有主题配色
- 米色 (Beige)
- 粉色 (Pink)
- 蓝色 (Blue)
- 薰衣草 (Lavender)
- 自定义背景

**技术实现：**
- 新组件：`src/components/TaskLabelsModal.jsx`
- 数据存储：`user_preferences.task_labels` (JSON数组)
- 云同步：自动保存到 Supabase
- 本地缓存：跨浏览器会话持久化

**新增翻译文本：** (`src/App.jsx`)
```javascript
manageLabels: "管理标签"
tagValidationEmpty: "标签不能为空"
tagValidationTooLong: "标签长度不能超过20个字符"
tagValidationDuplicate: "标签已存在"
noLabels: "暂无标签"
add: "添加"
save: "保存"
cancel: "取消"
edit: "编辑"
delete: "删除"
taskLabelsUpdated: "标签已保存"
```

**后续规划：**
- [ ] 在任务编辑表单中添加标签选择器
- [ ] 支持按标签筛选任务列表
- [ ] 标签的颜色自定义
- [ ] 标签使用统计

---

## 📝 文档更新

- `docs/FEATURES.md`
  - 添加 2.11.2 章节：番茄钟重复问题修复细节
  - 添加 2.12 章节：任务标签管理功能文档
  - 更新后续章节编号 (2.13→2.14)

---

## 🔍 测试建议

### 番茄钟修复验证
1. 启动计时器，计时几分钟后停止
2. 检查数据库 `pomodoro_sessions` 表，确认仅有一条记录
3. 快速连续启动/停止多个计时器，验证无重复
4. 检查 localStorage 中的本地会话记录数量

### 标签管理功能测试
1. 打开设置 → 管理标签
2. 测试添加标签（包括边界情况：空字符串、超长字符串、重复标签）
3. 测试编辑标签（取消、确认流程）
4. 测试删除标签
5. 刷新页面，验证标签持久化
6. 切换语言检查 UI 文本国际化
7. 切换主题检查 UI 样式适配

---

## 📊 文件修改统计

| 文件 | 修改类型 | 行数 |
|------|---------|------|
| `src/App.jsx` | 新增状态、函数、翻译文本 | +150 |
| `src/components/PomodoroTimer.jsx` | 修复逻辑 | ±5 |
| `src/components/TaskLabelsModal.jsx` | 新建文件 | +200 |
| `src/components/Header.jsx` | 新增按钮和props | +15 |
| `docs/FEATURES.md` | 文档更新 | +80 |

---

## 🚀 性能说明

- 番茄钟修复：**无性能影响**（仅改进逻辑）
- 标签管理：**极小性能影响**（添加本地重复检查 O(n))

---

## 🔐 安全说明

- 标签管理遵循现有的 RLS 政策（每个用户的标签隔离）
- 输入验证防止 XSS 攻击（标签长度限制、特殊字符处理）
- 所有用户数据更新均通过 Supabase 的认证流程

---

## ❓ 常见问题

**Q: 添加的标签现在在哪里使用？**
A: 当前版本仅为标签提供管理界面。标签应用到任务和筛选功能将在后续版本实现。

**Q: 旧数据库中的重复番茄记录怎么办？**
A: 建议保留现有记录用于历史参考。修复仅影响新建会话。如需清理，可通过 Supabase 后台查询手动删除。

**Q: 标签是否可以导出？**
A: 当前不支持。标签以 JSON 数组形式存储在 `user_preferences` 表中，可通过数据库查询导出。
