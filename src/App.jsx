import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Header,
  TaskManager,
  AuthModal,
  AddTaskModal,
  PlanWorkModal,
  ProfileSettingsModal,
  Toast,
  ConfirmModal,
} from "./components";

// OTP验证模态框组件
function OtpModal({ isOpen, onClose, t, otpEmail, otpCode, setOtpCode, onOtpVerify, pageBg }) {
  if (!isOpen) return null;

  const customInputStyle = {
    backgroundColor: "#faefdf",
    borderColor: "#e9bd34",
    color: "#2b2b2b",
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1040,
          animation: "fadeIn 0.3s ease-in-out",
        }}
      />
      {/* Modal */}
      <div 
        className="modal d-block" 
        tabIndex="-1"
        style={{
          animation: "slideDown 0.4s ease-out",
          zIndex: 1050,
        }}
      >
        <style>{`
          @keyframes slideDown {
            from {
              transform: translateY(-50px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}</style>
        <div className="modal-dialog" style={{ marginTop: "60px" }}>
          <div className="modal-content" style={{ backgroundColor: pageBg }}>
            <div className="modal-header">
              <h2 className="modal-title fs-6">{t.otpModalTitle}</h2>
              <button type="button" className="btn-close" aria-label={t.close} onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <p className="small text-body-secondary">
                  {t.otpSentIntro} <strong>{otpEmail}</strong> {t.otpSentOutro}
                </p>
              </div>
              <form className="d-grid gap-2" onSubmit={onOtpVerify}>
                <input 
                  className="form-control" 
                  type="text" 
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder={t.otpCodePlaceholder} 
                  value={otpCode} 
                  onChange={(e) => setOtpCode(e.target.value)}
                  style={customInputStyle}
                  required 
                />
                <button className="btn btn-warning text-dark" type="submit">{t.otpVerify}</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const SUPABASE_URL = "https://ccfmbcvlmlvirkattqnv.supabase.co";
const SUPABASE_KEY = "sb_publishable_XO9o2kqTKkcnHmGEqCmOoQ_vcNyBGk9";
const TODO_TABLE = "todos";
const PROFILE_TABLE = "profiles";
const PREFERENCES_TABLE = "user_preferences";

const STATUS_PENDING = "pending";
const STATUS_DONE = "done";

const GUEST_KEY = "taskease_todos_guest";
const THEME_KEY = "taskease_theme_mode";
const LANG_KEY = "taskease_lang";
const CLOCK_KEY = "taskease_clock_format";
const PENDING_USERNAME_KEY_PREFIX = "taskease_pending_username_";
const GUEST_LABELS_KEY = "taskease_task_labels_guest";

const TEXT = {
  "zh-CN": {
    appTitle: "TaskEase",
    settings: "设置",
    language: "语言",
    clockFormat: "时间制式",
    h12: "12 小时制",
    h24: "24 小时制",
    logout: "退出登录",
    login: "登录",
    account: "账号",
    register: "注册",
    email: "邮箱",
    username: "用户名",
    password: "密码",
    confirmPassword: "确认密码",
    close: "关闭",
    addTask: "添加任务",
    batchSelect: "批量选择",
    save: "保存",
    all: "全部",
    active: "进行中",
    done: "已完成",
    markDone: "标记完成",
    deleteSelected: "删除选中",
    exitBatch: "退出批量",
    noTask: "暂无任务",
    allDone: "🎉🎉🎉 所有任务均已完成！好好休息一下吧！🎉🎉🎉",
    edit: "编辑",
    remove: "删除",
    pendingSummary: "您还有",
    pendingSuffix: "个任务待完成，预计",
    hourUnit: "小时",
    localOnly: "Supabase 未连接，当前仅本地模式。",
    notLoginLocal: "未登录，使用本地模式。",
    syncFallback: "云同步失败，已回退本地。",
    addFallback: "云端添加失败，已写入本地。",
    updateRollback: "更新失败，已回滚。",
    deleteRollback: "删除失败，已回滚。",
    batchUpdateRollback: "批量更新失败，已回滚。",
    batchDeleteRollback: "批量删除失败，已回滚。",
    supabaseMissing: "Supabase 未连接。",
    invalidLogin: "请输入有效邮箱和密码。",
    loginFailed: "登录失败，请检查邮箱或密码。",
    invalidEmail: "请输入有效邮箱地址。",
    invalidUsername: "用户名需为 1-15 个字符，可包含中文、大小写和任意符号。",
    shortPassword: "密码至少 6 位。",
    passwordMismatch: "两次密码不一致。",
    usernameTaken: "用户名已存在。",
    registerFailed: "注册失败",
    registerSuccess: "注册成功。",
    registerNeedEmailCfg: "验证码已发送到邮箱，请输入邮件中的 6 位验证码完成注册。",
    otpModalTitle: "邮箱验证",
    otpSentIntro: "验证码已发送至",
    otpSentOutro: "，请输入邮件中的 6 位验证码。",
    otpCodePlaceholder: "6 位验证码",
    otpVerify: "验证",
    otpInvalid: "请输入邮箱验证码。",
    otpFailed: "验证码无效或已过期",
    registerVerified: "邮箱验证成功，已登录。",
    authRateLimitHint: "验证邮件发送过于频繁，请稍后再试。",
    cancel: "取消",
    addTaskSubmit: "添加",
    addFieldTitle: "标题",
    planWork: "自动规划",
    planWorkTitle: "工作时间自动规划",
    planAvailableHours: "接下来可工作的时长（小时）",
    planHoursPlaceholder: "例如：2.5",
    planGenerate: "生成建议",
    planInvalidHours: "请输入大于 0 的可用时长（小时）。",
    planNoActiveTasks: "没有可参与自动规划的任务：请至少在「预计小时」「截止时间」「优先级」中填写一项。",
    planSummary: "仅包含至少填写了预计时长、截止或优先级之一的进行中任务；已按截止时间、优先级与（或推测的）工时排序，建议如下：",
    planNothingPacked: "未能安排任何任务，请检查可用时长或任务列表。",
    planSuggestWork: "建议投入",
    planFullEstimate: "预计总需",
    planInferredHours: "工时为推测值（无预计时长时根据截止/优先级估算）",
    planPartial: "本时段内时间不足以完成全部",
    planTimeRemaining: "尚未分配完的剩余时间",
    emptyTitle: "请填写任务标题。",
    editTask: "编辑任务",
    saveChanges: "保存",
    addTaskHintTitle: "添加任务规则说明",
    addTaskHint: "· 标题为必填项。\n· 预计小时、截止时间、优先级均为选填。\n· 若以上三项全部留空，自动规划不会纳入该任务。\n· 仅填部分字段时，规划会结合已有信息并推测所需工时。",
    tagSearchPlaceholder: "搜索或选择标签",
    tagAddNew: "＋新增",
    newTagPrompt: "新标签名称",
    tagNone: "（未选）",
    tagSelected: "当前标签",
    tagClear: "清除",
    tagPickHint: "点击选用",
    optionalPlaceholder: "选填",
    progress: "进度",
    remHours: "预计剩余",
    remarkPrefix: "备注：",
    taskComplete: "完成",
    taskCompletedState: "已完成",
    deleteTask: "删除任务",
    confirmDeleteTitle: "确认删除",
    confirmDeleteMessage: "确定要删除该任务吗？此操作无法撤销。",
    confirmDelete: "确认删除",
    tagModalTitle: "新增标签",
    tagModalConfirm: "添加",
    planAlgorithmAria: "自动规划算法说明",
    planAlgorithmHint:
      "算法步骤：\n1. 只纳入「进行中」且预计时长、截止时间、优先级至少填写过一项的任务。\n2. 按截止时间从早到晚排序；无截止时间排在后面；同一截止时间内按优先级数字从大到小。\n3. 若未填预计时长，根据是否填写截止、优先级推测所需工时。\n4. 按上述顺序将任务依次装入你输入的可用时长，直至时间用完或没有可装任务。",
    profileSettings: "个人资料设置",
    updateEmail: "更改邮箱",
    updateUsername: "更改用户名",
    resetPassword: "重置密码",
    updateEmailSuccess: "邮箱更新请求已发送，请前往邮箱确认。",
    updateUsernameSuccess: "用户名更新成功。",
    resetPasswordSent: "密码重置邮件已发送，请查收。",
    usernameDbConstraintHint: "数据库仍在使用旧用户名规则，请先执行 supabase/profiles_username_constraint_migration.sql。",
    usernameUnchanged: "用户名未变化。",
    actionNeedLogin: "请先登录后再操作。",
    requestTimeout: "请求超时，请重试。",
    loggedInAs: "已登录用户",
    editPrompt: "编辑任务",
    titlePlaceholder: "任务标题",
    estHours: "预计小时",
    dueAt: "截止时间",
    label: "标签",
    priority: "优先级",
    remark: "备注",
    weekdays: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
  },
  "zh-TW": {
    appTitle: "TaskEase",
    settings: "設定",
    language: "語言",
    clockFormat: "時間制式",
    h12: "12 小時制",
    h24: "24 小時制",
    logout: "登出",
    login: "登入",
    account: "帳號",
    register: "註冊",
    email: "電子郵件",
    username: "使用者名稱",
    password: "密碼",
    confirmPassword: "確認密碼",
    close: "關閉",
    addTask: "新增任務",
    batchSelect: "批次選擇",
    save: "儲存",
    all: "全部",
    active: "進行中",
    done: "已完成",
    markDone: "標記完成",
    deleteSelected: "刪除選取",
    exitBatch: "退出批次",
    noTask: "暫無任務",
    allDone: "🎉🎉🎉 所有任務均已完成！好好休息一下吧！🎉🎉🎉",
    edit: "編輯",
    remove: "刪除",
    pendingSummary: "您還有",
    pendingSuffix: "個任務待完成，預計",
    hourUnit: "小時",
    localOnly: "Supabase 未連線，目前僅本地模式。",
    notLoginLocal: "未登入，使用本地模式。",
    syncFallback: "雲同步失敗，已退回本地。",
    addFallback: "雲端新增失敗，已寫入本地。",
    updateRollback: "更新失敗，已回滾。",
    deleteRollback: "刪除失敗，已回滾。",
    batchUpdateRollback: "批次更新失敗，已回滾。",
    batchDeleteRollback: "批次刪除失敗，已回滾。",
    supabaseMissing: "Supabase 未連線。",
    invalidLogin: "請輸入有效電子郵件與密碼。",
    loginFailed: "登入失敗，請檢查電子郵件或密碼。",
    invalidEmail: "請輸入有效電子郵件地址。",
    invalidUsername: "使用者名稱需為 1-15 個字元，可包含中文、大小寫與任意符號。",
    shortPassword: "密碼至少 6 碼。",
    passwordMismatch: "兩次密碼不一致。",
    usernameTaken: "使用者名稱已存在。",
    registerFailed: "註冊失敗",
    registerSuccess: "註冊成功。",
    registerNeedEmailCfg: "驗證碼已傳送至電子郵件，請輸入郵件中的 6 位驗證碼完成註冊。",
    otpModalTitle: "電子郵件驗證",
    otpSentIntro: "驗證碼已傳送至",
    otpSentOutro: "，請輸入郵件中的 6 位驗證碼。",
    otpCodePlaceholder: "6 位驗證碼",
    otpVerify: "驗證",
    otpInvalid: "請輸入驗證碼。",
    otpFailed: "驗證碼無效或已過期",
    registerVerified: "電子郵件驗證成功，已登入。",
    authRateLimitHint: "驗證郵件傳送過於頻繁，請稍後再試。",
    cancel: "取消",
    addTaskSubmit: "新增",
    addFieldTitle: "標題",
    planWork: "自動規劃",
    planWorkTitle: "工作時間自動規劃",
    planAvailableHours: "接下來可工作的時長（小時）",
    planHoursPlaceholder: "例如：2.5",
    planGenerate: "產生建議",
    planInvalidHours: "請輸入大於 0 的可用時長（小時）。",
    planNoActiveTasks: "沒有可參與自動規劃的任務：請至少在「預計小時」「截止時間」「優先級」中填寫一項。",
    planSummary: "僅包含至少填寫了預計時長、截止或優先級之一的進行中任務；已依截止時間、優先級與（或推測的）工時排序，建議如下：",
    planNothingPacked: "未能安排任何任務，請檢查可用時長或任務列表。",
    planSuggestWork: "建議投入",
    planFullEstimate: "預計總需",
    planInferredHours: "工時為推測值（無預計時長時依截止/優先級估算）",
    planPartial: "本時段內時間不足以完成全部",
    planTimeRemaining: "尚未分配完的剩餘時間",
    emptyTitle: "請填寫任務標題。",
    editTask: "編輯任務",
    saveChanges: "儲存",
    addTaskHintTitle: "新增任務規則說明",
    addTaskHint: "· 標題為必填。\n· 預計小時、截止時間、優先級皆為選填。\n· 若以上三項全部留空，自動規劃不會納入該任務。\n· 僅填部分欄位時，規劃會結合已有資訊並推測所需工時。",
    tagSearchPlaceholder: "搜尋或選擇標籤",
    tagAddNew: "＋新增",
    newTagPrompt: "新標籤名稱",
    tagNone: "（未選）",
    progress: "進度",
    remHours: "預計剩餘",
    remarkPrefix: "備註：",
    taskComplete: "完成",
    taskCompletedState: "已完成",
    deleteTask: "刪除任務",
    confirmDeleteTitle: "確認刪除",
    confirmDeleteMessage: "確定要刪除此任務嗎？此操作無法復原。",
    confirmDelete: "確認刪除",
    tagModalTitle: "新增標籤",
    tagModalConfirm: "新增",
    planAlgorithmAria: "自動規劃演算法說明",
    planAlgorithmHint:
      "演算法步驟：\n1. 只納入「進行中」且預計時長、截止時間、優先級至少填寫過一項的任務。\n2. 依截止時間由早到晚排序；無截止時間排在後面；同一截止時間內依優先級數字由大到小。\n3. 若未填預計時長，依是否填寫截止、優先級推測所需工時。\n4. 依上述順序將任務依次裝入你輸入的可用時長，直至時間用完或沒有可裝任務。",
    profileSettings: "個人資料設定",
    updateEmail: "變更電子郵件",
    updateUsername: "變更使用者名稱",
    resetPassword: "重設密碼",
    updateEmailSuccess: "電子郵件更新請求已送出，請前往信箱確認。",
    updateUsernameSuccess: "使用者名稱更新成功。",
    resetPasswordSent: "密碼重設郵件已送出，請查收。",
    usernameDbConstraintHint: "資料庫仍使用舊的使用者名稱規則，請先執行 supabase/profiles_username_constraint_migration.sql。",
    usernameUnchanged: "使用者名稱未變更。",
    actionNeedLogin: "請先登入後再操作。",
    requestTimeout: "請求逾時，請重試。",
    loggedInAs: "已登入使用者",
    editPrompt: "編輯任務",
    titlePlaceholder: "任務標題",
    estHours: "預估小時",
    dueAt: "截止時間",
    label: "標籤",
    priority: "優先級",
    remark: "備註",
    weekdays: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
  },
  en: {
    appTitle: "TaskEase",
    settings: "Settings",
    language: "Language",
    clockFormat: "Clock Format",
    h12: "12-hour",
    h24: "24-hour",
    logout: "Logout",
    login: "Login",
    account: "Account",
    register: "Register",
    email: "Email",
    username: "Username",
    password: "Password",
    confirmPassword: "Confirm Password",
    close: "Close",
    addTask: "Add Task",
    batchSelect: "Batch Select",
    save: "Save",
    all: "All",
    active: "Active",
    done: "Completed",
    markDone: "Mark Done",
    deleteSelected: "Delete Selected",
    exitBatch: "Exit Batch",
    noTask: "No tasks",
    allDone: "🎉🎉🎉 All tasks are completed! Take a good break! 🎉🎉🎉",
    edit: "Edit",
    remove: "Delete",
    pendingSummary: "You still have",
    pendingSuffix: "tasks pending, estimated",
    hourUnit: "hours",
    localOnly: "Supabase unavailable. Local mode only.",
    notLoginLocal: "Not logged in, using local mode.",
    syncFallback: "Cloud sync failed. Falling back to local.",
    addFallback: "Cloud add failed. Saved locally.",
    updateRollback: "Update failed and rolled back.",
    deleteRollback: "Delete failed and rolled back.",
    batchUpdateRollback: "Batch update failed and rolled back.",
    batchDeleteRollback: "Batch delete failed and rolled back.",
    supabaseMissing: "Supabase unavailable.",
    invalidLogin: "Please enter a valid email and password.",
    loginFailed: "Login failed. Check email/password.",
    invalidEmail: "Please enter a valid email address.",
    invalidUsername: "Username must be 1-15 characters. Any characters are allowed.",
    shortPassword: "Password must be at least 6 characters.",
    passwordMismatch: "Passwords do not match.",
    usernameTaken: "Username already exists.",
    registerFailed: "Registration failed",
    registerSuccess: "Registration successful.",
    registerNeedEmailCfg: "We sent a code to your email. Enter the 6-digit code from the email to finish signing up.",
    otpModalTitle: "Email verification",
    otpSentIntro: "We sent a code to",
    otpSentOutro: ". Enter the 6-digit code from the email.",
    otpCodePlaceholder: "6-digit code",
    otpVerify: "Verify",
    otpInvalid: "Please enter the verification code.",
    otpFailed: "Invalid or expired code",
    registerVerified: "Email verified. You are signed in.",
    authRateLimitHint: "Too many verification emails were sent. Please wait and try again.",
    cancel: "Cancel",
    addTaskSubmit: "Add",
    addFieldTitle: "Title",
    planWork: "Auto plan",
    planWorkTitle: "Plan your work session",
    planAvailableHours: "Hours you can still work (h)",
    planHoursPlaceholder: "e.g. 2.5",
    planGenerate: "Build suggestions",
    planInvalidHours: "Enter available hours greater than zero.",
    planNoActiveTasks: "No tasks qualify for auto-plan: fill at least one of estimated hours, due date, or priority.",
    planSummary: "Includes active tasks that have at least one of hours/due/priority set; ordered by due date, priority, and inferred or actual effort:",
    planNothingPacked: "No tasks fit this window. Check the time budget or your task list.",
    planSuggestWork: "Spend",
    planFullEstimate: "Total estimate",
    planInferredHours: "time is inferred when hours are missing (from due date / priority)",
    planPartial: "not enough time to finish fully in this session",
    planTimeRemaining: "Unused time in this budget",
    emptyTitle: "Please enter a task title.",
    editTask: "Edit task",
    saveChanges: "Save",
    addTaskHintTitle: "Rules for adding tasks",
    addTaskHint: "· Title is required.\n· Estimated hours, due time, and priority are optional.\n· If all three are left empty, auto-plan will skip this task.\n· If only some are set, planning uses them and infers effort when needed.",
    tagSearchPlaceholder: "Search or pick a label",
    tagAddNew: "+ New",
    newTagPrompt: "New label name",
    tagNone: "(none)",
    tagSelected: "Selected",
    tagClear: "Clear",
    tagPickHint: "Click to use",
    optionalPlaceholder: "Optional",
    progress: "Progress",
    remHours: "Remaining est.",
    remarkPrefix: "Note: ",
    taskComplete: "Done",
    taskCompletedState: "Completed",
    deleteTask: "Delete task",
    confirmDeleteTitle: "Delete task?",
    confirmDeleteMessage: "This task will be removed permanently. This cannot be undone.",
    confirmDelete: "Delete",
    tagModalTitle: "New label",
    tagModalConfirm: "Add",
    planAlgorithmAria: "Auto-plan algorithm",
    planAlgorithmHint:
      "How it works:\n1. Only active tasks that have at least one of: estimated hours, due time, or priority.\n2. Sort by earliest due time first; tasks without a due time go last; tie-break by higher priority number.\n3. If hours are missing, infer duration from due time and/or priority.\n4. Greedily pack tasks into your available time budget in that order until time runs out.",
    profileSettings: "Profile Settings",
    updateEmail: "Change Email",
    updateUsername: "Change Username",
    resetPassword: "Reset Password",
    updateEmailSuccess: "Email update request sent. Please confirm in your mailbox.",
    updateUsernameSuccess: "Username updated successfully.",
    resetPasswordSent: "Password reset email sent. Please check your mailbox.",
    usernameDbConstraintHint: "Database is still using old username constraint. Please run supabase/profiles_username_constraint_migration.sql first.",
    usernameUnchanged: "Username is unchanged.",
    actionNeedLogin: "Please login first.",
    requestTimeout: "Request timed out. Please try again.",
    loggedInAs: "Logged in as",
    editPrompt: "Edit task",
    titlePlaceholder: "Task title",
    estHours: "Estimated hours",
    dueAt: "Due time",
    label: "Label",
    priority: "Priority",
    remark: "Remark",
    weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  },
};

const supabase = buildSupabaseClient();

function buildSupabaseClient() {
  const valid = /^https:\/\/.+\.supabase\.co$/i.test(SUPABASE_URL.trim()) && SUPABASE_KEY.trim();
  if (!valid) return null;
  try {
    return createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch {
    return null;
  }
}

function normalizeUsername(name) {
  return String(name || "").trim();
}

function isValidUsername(name) {
  const value = String(name || "").trim();
  const length = Array.from(value).length;
  return length >= 1 && length <= 15;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function isAuthRateLimitError(error) {
  if (!error) return false;
  const status = Number(error.status);
  if (status === 429) return true;
  const msg = String(error.message || "").toLowerCase();
  const code = String(error.code || "").toLowerCase();
  if (code.includes("over_email") || code.includes("rate") || code === "too_many_requests") return true;
  if (
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("too many") ||
    msg.includes("email rate limit") ||
    msg.includes("seconds before") ||
    msg.includes("security purposes")
  ) {
    return true;
  }
  return false;
}

function isTransientLockError(error) {
  const message = String(error?.message || "");
  return message.includes("Lock broken by another request") || message.includes("AbortError");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, ms = 10000) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("TIMEOUT")), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

function readLocalTodos(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      progress_percent: snapProgress(item?.progress_percent),
      estimated_hours: Number(item?.estimated_hours ?? 0),
      priority: Number(item?.priority ?? 0),
    }));
  } catch {
    return [];
  }
}

function writeLocalTodos(key, todos) {
  localStorage.setItem(key, JSON.stringify(todos));
}

function getPendingUsernameByEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return "";
  return localStorage.getItem(`${PENDING_USERNAME_KEY_PREFIX}${normalized}`) || "";
}

function setPendingUsernameByEmail(email, username) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedUsername = String(username || "").trim();
  if (!normalizedEmail || !normalizedUsername) return;
  localStorage.setItem(`${PENDING_USERNAME_KEY_PREFIX}${normalizedEmail}`, normalizedUsername);
}

function clearPendingUsernameByEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return;
  localStorage.removeItem(`${PENDING_USERNAME_KEY_PREFIX}${normalized}`);
}

function snapProgress(v) {
  const x = Number(v);
  if (!Number.isFinite(x)) return 0;
  const c = Math.round(x / 10) * 10;
  return Math.max(0, Math.min(100, c));
}

function toDatetimeLocalValue(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseTaskLabels(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map((x) => String(x).trim()).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapTodo(row) {
  const status = row.status ?? STATUS_PENDING;
  return {
    id: row.id,
    title: row.title || "",
    status,
    estimated_hours: Number(row.estimated_hours ?? 0),
    ddl: row.ddl ?? null,
    remark: row.remark ?? "",
    priority: Number(row.priority ?? 0),
    label: row.label ?? "",
    progress_percent: snapProgress(row.progress_percent ?? 0),
    user_id: row.user_id,
    created_at: row.created_at,
  };
}

function getClockParts(now, lang, hourFormat) {
  const locale = lang === "en" ? "en-US" : lang;
  const date = new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const weekday = TEXT[lang].weekdays[now.getDay()];
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: hourFormat === "12h",
  }).format(now);
  return { date, weekday, time };
}

export default function App() {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "zh-CN" || saved === "zh-TW" || saved === "en") return saved;
    return "zh-CN";
  });
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  });
  const [clockFormat, setClockFormat] = useState(() => {
    const saved = localStorage.getItem(CLOCK_KEY);
    return saved === "12h" || saved === "24h" ? saved : "24h";
  });

  const [resolvedTheme, setResolvedTheme] = useState("light");
  const [now, setNow] = useState(() => new Date());

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPlanWorkModalOpen, setIsPlanWorkModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeAuthTab, setActiveAuthTab] = useState("login");
  const [isSyncing, setIsSyncing] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  // OTP验证相关状态
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");

  const [notice, setNotice] = useState({ text: "", warning: false });

  const [batchMode, setBatchMode] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [draft, setDraft] = useState({
    title: "",
    estimated_hours: "",
    ddl: "",
    label: "",
    priority: "",
    remark: "",
  });

  const [editingTodoId, setEditingTodoId] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [taskLabels, setTaskLabels] = useState([]);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const previousUserIdRef = useRef(null);

  const [todos, setTodos] = useState([]);

  const t = TEXT[lang];
  const storageKey = user ? `taskease_todos_${user.id}` : GUEST_KEY;

  const pageBg = resolvedTheme === "dark" ? "#1e2636" : "#efe3cb";
  const panelBg = resolvedTheme === "dark" ? "#2a3447" : "#f8eede";
  const listBg = resolvedTheme === "dark" ? "#334159" : "#faefdf";
  const logoColor = resolvedTheme === "dark" ? "#f8e7c4" : "#6b4f2f";

  function notify(text, warning = true) {
    setNotice({ text, warning });
    window.setTimeout(() => {
      setNotice((prev) => (prev.text === text ? { text: "", warning: false } : prev));
    }, 4500);
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function resolve(mode) {
      if (mode === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return mode;
    }

    const next = resolve(themeMode);
    setResolvedTheme(next);
    document.documentElement.setAttribute("data-bs-theme", next);
    localStorage.setItem(THEME_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(CLOCK_KEY, clockFormat);
  }, [clockFormat]);

  useEffect(() => {
    if (themeMode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const next = media.matches ? "dark" : "light";
      setResolvedTheme(next);
      document.documentElement.setAttribute("data-bs-theme", next);
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [themeMode]);

  useEffect(() => {
    if (!supabase) {
      notify(t.localOnly, true);
      setTodos(readLocalTodos(storageKey));
      return;
    }

    let mounted = true;

    async function initSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;

      const current = session?.user ?? null;
      setUser(current);
      if (!current) {
        setUsername("");
        setTodos(readLocalTodos(GUEST_KEY));
      }
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const current = session?.user ?? null;
      setUser(current);
      setSelectedIds(new Set());
      setBatchMode(false);

      if (!current) {
        setPreferencesLoaded(false);
        setUsername("");
        setTodos(readLocalTodos(GUEST_KEY));
        previousUserIdRef.current = null;
        return;
      }

      if (previousUserIdRef.current !== current.id) {
        setPreferencesLoaded(false);
        previousUserIdRef.current = current.id;
      }

      const foundName = await loadOrCreateUsername(current);
      setUsername(foundName);
      await loadPreferences(current.id);
      const nextTodos = await loadTodosForUser(current.id);
      setTodos(nextTodos);
      writeLocalTodos(`taskease_todos_${current.id}`, nextTodos);
      setPreferencesLoaded(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [t.localOnly, t.notLoginLocal]);

  useEffect(() => {
    if (!user) return;
    loadTodosForUser(user.id).then((data) => {
      setTodos(data);
      writeLocalTodos(storageKey, data);
    });
  }, [user]);

  useEffect(() => {
    if (user) return;
    try {
      const raw = localStorage.getItem(GUEST_LABELS_KEY);
      if (raw) setTaskLabels(parseTaskLabels(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    if (!supabase || !user || !preferencesLoaded) return;
    savePreferences(user.id, {
      language: lang,
      clock_format: clockFormat,
      theme_mode: themeMode,
      task_labels: taskLabels,
    });
  }, [user, lang, clockFormat, themeMode, taskLabels, preferencesLoaded]);

  const visibleTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (filter === "active") return todo.status !== STATUS_DONE;
      if (filter === "done") return todo.status === STATUS_DONE;
      return true;
    });
  }, [todos, filter]);

  const pendingTodos = useMemo(() => todos.filter((item) => item.status !== STATUS_DONE), [todos]);

  const estimateHours = useMemo(() => {
    const sum = pendingTodos.reduce((acc, item) => acc + Number(item.estimated_hours || 0), 0);
    return Number.isFinite(sum) ? sum.toFixed(1) : "0.0";
  }, [pendingTodos]);

  const mergedTaskLabels = useMemo(() => {
    const fromTodos = todos.map((x) => String(x.label || "").trim()).filter(Boolean);
    const set = new Set([...taskLabels.map((x) => String(x).trim()).filter(Boolean), ...fromTodos]);
    return Array.from(set).sort((a, b) => a.localeCompare(b, lang));
  }, [todos, taskLabels, lang]);

  const clock = getClockParts(now, lang, clockFormat);

  function yellowButtonStyle(active) {
    return {
      backgroundColor: active ? "#e0ae1c" : "#f2c84b",
      color: "#2b2b2b",
      borderColor: active ? "#d39d0c" : "#e9bd34",
    };
  }

  async function loadTodosForUser(userId) {
    if (!supabase || !userId) return readLocalTodos(GUEST_KEY);

    let result = await supabase
      .from(TODO_TABLE)
      .select("id,title,status,estimated_hours,ddl,remark,priority,label,progress_percent,created_at,user_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Transient auth lock conflict can happen when multiple auth requests overlap.
    // Retry once instead of immediately falling back to local storage.
    if (result.error && isTransientLockError(result.error)) {
      await sleep(250);
      result = await supabase
        .from(TODO_TABLE)
        .select("id,title,status,estimated_hours,ddl,remark,priority,label,progress_percent,created_at,user_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
    }

    const { data, error } = result;

    if (error) {
      if (!isTransientLockError(error)) {
        notify(`${t.syncFallback} ${error.message || ""}`.trim(), true);
      }
      return readLocalTodos(`taskease_todos_${userId}`);
    }

    return (Array.isArray(data) ? data : []).map(mapTodo);
  }

  async function loadPreferences(userId) {
    const { data } = await supabase
      .from(PREFERENCES_TABLE)
      .select("language,clock_format,theme_mode,task_labels")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data) return;
    if (data.language && (data.language === "zh-CN" || data.language === "zh-TW" || data.language === "en")) setLang(data.language);
    if (data.clock_format && (data.clock_format === "12h" || data.clock_format === "24h")) setClockFormat(data.clock_format);
    if (data.theme_mode && (data.theme_mode === "light" || data.theme_mode === "dark" || data.theme_mode === "system")) setThemeMode(data.theme_mode);
    if (data.task_labels !== undefined && data.task_labels !== null) {
      setTaskLabels(parseTaskLabels(data.task_labels));
    }
  }

  async function savePreferences(userId, prefs) {
    await supabase.from(PREFERENCES_TABLE).upsert(
      {
        user_id: userId,
        ...prefs,
      },
      { onConflict: "user_id" },
    );
  }

  async function loadOrCreateUsername(currentUser) {
    const { data } = await supabase
      .from(PROFILE_TABLE)
      .select("username")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (data?.username) return data.username;

    // If there is no profile row yet (common with confirm-email flow),
    // do NOT force-write "user" into profiles.
    // Only create profile when we have a valid candidate username.
    const metaName = normalizeUsername(currentUser.user_metadata?.username || "");
    if (isValidUsername(metaName)) {
      await ensureProfile(currentUser.id, metaName);
      return metaName;
    }

    const pendingName = normalizeUsername(getPendingUsernameByEmail(currentUser.email || ""));
    if (isValidUsername(pendingName)) {
      await ensureProfile(currentUser.id, pendingName);
      clearPendingUsernameByEmail(currentUser.email || "");
      return pendingName;
    }

    return "user";
  }

  async function ensureProfile(userId, name) {
    await supabase.from(PROFILE_TABLE).upsert(
      {
        user_id: userId,
        username: name,
      },
      { onConflict: "user_id" },
    );
  }

  async function isUsernameTaken(name) {
    const { data, error } = await supabase.from(PROFILE_TABLE).select("id").eq("username", name).limit(1);
    if (error) return false;
    return Array.isArray(data) && data.length > 0;
  }

  function syncLocal(nextTodos) {
    writeLocalTodos(storageKey, nextTodos);
  }

  function resetDraft() {
    setDraft({
      title: "",
      estimated_hours: "",
      ddl: "",
      label: "",
      priority: "",
      remark: "",
    });
  }

  function openAddTaskModal() {
    setEditingTodoId(null);
    resetDraft();
    setIsAddModalOpen(true);
  }

  function openEditTodo(todo) {
    setEditingTodoId(todo.id);
    setDraft({
      title: todo.title || "",
      estimated_hours: Number(todo.estimated_hours) > 0 ? String(todo.estimated_hours) : "",
      ddl: todo.ddl ? toDatetimeLocalValue(todo.ddl) : "",
      label: todo.label || "",
      priority: Number(todo.priority) > 0 ? String(todo.priority) : "",
      remark: todo.remark || "",
    });
    setIsAddModalOpen(true);
  }

  function closeAddModal() {
    setIsAddModalOpen(false);
    setEditingTodoId(null);
    resetDraft();
  }

  function handleAddLabelToLibrary(tag) {
    const trimmed = String(tag || "").trim();
    if (!trimmed) return;
    const next = Array.from(new Set([...taskLabels.map((x) => String(x).trim()).filter(Boolean), trimmed])).sort((a, b) =>
      a.localeCompare(b, lang),
    );
    setTaskLabels(next);
    if (!user) {
      try {
        localStorage.setItem(GUEST_LABELS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }
    setDraft((p) => ({ ...p, label: trimmed }));
  }

  async function handleTaskFormSubmit(event) {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) {
      notify(t.emptyTitle, true);
      return;
    }

    const estRaw = String(draft.estimated_hours ?? "").trim();
    const estimated_hours = estRaw === "" ? 0 : Math.max(0, Number(estRaw));
    const ddl = draft.ddl ? new Date(draft.ddl).toISOString() : null;
    const priRaw = String(draft.priority ?? "").trim();
    const priority = priRaw === "" ? 0 : Math.max(0, Math.min(10, Number(priRaw)));
    const label = String(draft.label ?? "").trim() || null;
    const remark = String(draft.remark ?? "").trim() || null;

    if (editingTodoId) {
      const patch = { title, estimated_hours, ddl, remark, priority, label };
      await updateTodo(editingTodoId, patch);
      closeAddModal();
      return;
    }

    const payload = {
      id: crypto.randomUUID(),
      title,
      status: STATUS_PENDING,
      estimated_hours,
      ddl,
      remark,
      priority,
      label,
      progress_percent: 0,
      created_at: new Date().toISOString(),
    };

    if (supabase && user) {
      const { data, error } = await supabase
        .from(TODO_TABLE)
        .insert(payload)
        .select("id,title,status,estimated_hours,ddl,remark,priority,label,progress_percent,created_at,user_id")
        .single();

      if (!error && data) {
        const next = [mapTodo(data), ...todos];
        setTodos(next);
        syncLocal(next);
        closeAddModal();
        return;
      }

      notify(`${t.addFallback} ${error?.message || ""}`.trim(), true);
    }

    const next = [mapTodo(payload), ...todos];
    setTodos(next);
    syncLocal(next);
    closeAddModal();
  }

  async function updateTodo(id, patch) {
    const previous = todos;
    const nextPatch = { ...patch };
    if (nextPatch.progress_percent != null) {
      nextPatch.progress_percent = snapProgress(nextPatch.progress_percent);
    }
    const next = todos.map((item) => (item.id === id ? { ...item, ...nextPatch } : item));
    setTodos(next);

    if (supabase && user) {
      const dbPatch = Object.fromEntries(Object.entries(nextPatch).filter(([, v]) => v !== undefined));
      const { error } = await supabase.from(TODO_TABLE).update(dbPatch).eq("id", id).eq("user_id", user.id);
      if (error) {
        setTodos(previous);
        notify(`${t.updateRollback} ${error.message || ""}`.trim(), true);
        return;
      }
    }

    syncLocal(next);
  }

  async function handleDelete(id) {
    const previous = todos;
    const next = todos.filter((item) => item.id !== id);
    setTodos(next);

    if (supabase && user) {
      const { error } = await supabase.from(TODO_TABLE).delete().eq("id", id).eq("user_id", user.id);
      if (error) {
        setTodos(previous);
        notify(`${t.deleteRollback} ${error.message || ""}`.trim(), true);
        return;
      }
    }

    syncLocal(next);
  }

  async function confirmDeleteEditingTask() {
    const id = editingTodoId;
    if (!id) return;
    await handleDelete(id);
    setConfirmDeleteOpen(false);
    closeAddModal();
  }

  async function handleBatchDone() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      notify(t.batchUpdateRollback, true);
      return;
    }

    const previous = todos;
    const selected = new Set(ids);
    const next = todos.map((item) => (selected.has(item.id) ? { ...item, status: STATUS_DONE } : item));
    setTodos(next);

    if (supabase && user) {
      const { error } = await supabase.from(TODO_TABLE).update({ status: STATUS_DONE }).in("id", ids).eq("user_id", user.id);
      if (error) {
        setTodos(previous);
        notify(`${t.batchUpdateRollback} ${error.message || ""}`.trim(), true);
        return;
      }
    }

    setSelectedIds(new Set());
    syncLocal(next);
  }

  async function handleBatchDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      notify(t.batchDeleteRollback, true);
      return;
    }

    const previous = todos;
    const selected = new Set(ids);
    const next = todos.filter((item) => !selected.has(item.id));
    setTodos(next);

    if (supabase && user) {
      const { error } = await supabase.from(TODO_TABLE).delete().in("id", ids).eq("user_id", user.id);
      if (error) {
        setTodos(previous);
        notify(`${t.batchDeleteRollback} ${error.message || ""}`.trim(), true);
        return;
      }
    }

    setSelectedIds(new Set());
    syncLocal(next);
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (!supabase) {
      notify(t.supabaseMissing, true);
      return;
    }

    const email = String(loginEmail || "").trim().toLowerCase();
    if (!isValidEmail(email) || loginPassword.length < 6) {
      notify(t.invalidLogin, true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: loginPassword,
    });

    if (error) {
      notify(`${t.loginFailed}: ${error.message}`, true);
      return;
    }

    setIsAuthModalOpen(false);
    setLoginEmail("");
    setLoginPassword("");
  }

  async function handleRegister(event) {
    event.preventDefault();

    if (!supabase) {
      notify(t.supabaseMissing, true);
      return;
    }

    const uname = normalizeUsername(registerUsername);
    const email = String(registerEmail || "").trim().toLowerCase();
    if (!isValidUsername(uname)) {
      notify(t.invalidUsername, true);
      return;
    }

    if (!isValidEmail(email)) {
      notify(t.invalidEmail, true);
      return;
    }

    if (registerPassword.length < 6) {
      notify(t.shortPassword, true);
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      notify(t.passwordMismatch, true);
      return;
    }

    if (await isUsernameTaken(uname)) {
      notify(t.usernameTaken, true);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: registerPassword,
      options: {
        data: {
          username: uname,
        },
      },
    });

    if (error) {
      if (isAuthRateLimitError(error)) {
        notify(t.authRateLimitHint, true);
        return;
      }
      if (String(error.message || "").includes("profiles_username_check")) {
        notify(t.usernameDbConstraintHint, true);
        return;
      }
      notify(`${t.registerFailed}: ${error.message}`, true);
      return;
    }

    const newUser = data.user;
    if (!newUser) {
      notify(t.registerFailed, true);
      return;
    }

    setPendingUsernameByEmail(email, uname);

    if (data.session) {
      await ensureProfile(newUser.id, uname);
      clearPendingUsernameByEmail(email);
      notify(t.registerSuccess, false);
      setIsAuthModalOpen(false);
      setRegisterUsername("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
      return;
    }

    setOtpEmail(email);
    setOtpCode("");
    setIsOtpModalOpen(true);
    setIsAuthModalOpen(false);
    notify(t.registerNeedEmailCfg, false);
    setRegisterPassword("");
    setRegisterConfirmPassword("");
    setRegisterUsername("");
    setRegisterEmail("");
  }

  async function handleOtpVerify(event) {
    event.preventDefault();

    if (!supabase) {
      notify(t.supabaseMissing, true);
      return;
    }

    const email = String(otpEmail || "").trim().toLowerCase();
    const token = String(otpCode || "").trim().replace(/\s/g, "");
    if (!email || !token) {
      notify(t.otpInvalid, true);
      return;
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });

    if (error) {
      if (isAuthRateLimitError(error)) {
        notify(t.authRateLimitHint, true);
        return;
      }
      notify(`${t.otpFailed}: ${error.message}`, true);
      return;
    }

    if (!data?.session) {
      notify(t.otpFailed, true);
      return;
    }

    setIsOtpModalOpen(false);
    setOtpEmail("");
    setOtpCode("");
    notify(t.registerVerified, false);
  }

  async function handleLogout() {
    try {
      if (!supabase) {
        // 如果Supabase不可用，强制清除本地状态
        setUser(null);
        setUsername("");
        setTodos(readLocalTodos(GUEST_KEY));
        setIsAuthModalOpen(false);
        notify('已退出登录', false);
        return;
      }
      
      await supabase.auth.signOut();
      setUser(null);
      setUsername("");
      setTodos(readLocalTodos(GUEST_KEY));
      setIsAuthModalOpen(false);
      notify('已退出登录', false);
    } catch (error) {
      console.error('登出失败:', error);
      // 即使登出失败，也强制清除本地状态
      setUser(null);
      setUsername("");
      setTodos(readLocalTodos(GUEST_KEY));
      setIsAuthModalOpen(false);
      notify('已退出登录', false);
    }
  }

  async function handleUpdateEmail(nextEmail) {
    if (!supabase || !user) {
      notify(t.actionNeedLogin, true);
      return false;
    }
    const email = String(nextEmail || "").trim().toLowerCase();
    if (!isValidEmail(email)) {
      notify(t.invalidEmail, true);
      return false;
    }

    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      notify(`${t.registerFailed}: ${error.message}`, true);
      return false;
    }
    notify(t.updateEmailSuccess, false);
    return true;
  }

  async function handleUpdateUsername(nextUsername) {
    if (!supabase || !user) {
      notify(t.actionNeedLogin, true);
      return false;
    }
    const uname = normalizeUsername(nextUsername);
    if (!isValidUsername(uname)) {
      notify(t.invalidUsername, true);
      return false;
    }

    if (uname === username) {
      notify(t.usernameUnchanged, true);
      return false;
    }

    try {
      // First try updating existing profile row.
      let updateResult;
      try {
        updateResult = await withTimeout(
          supabase
            .from(PROFILE_TABLE)
            .update({ username: uname })
            .eq("user_id", user.id)
            .select("username")
            .maybeSingle(),
          10000,
        );
      } catch (timeoutError) {
        if (String(timeoutError?.message || "") === "TIMEOUT") {
          notify(t.requestTimeout, true);
          return false;
        }
        throw timeoutError;
      }

      const { data: updated, error: updateError } = updateResult;

      if (updateError) {
        if (updateError.code === "23505") {
          notify(t.usernameTaken, true);
          return false;
        }
        // 处理数据库约束错误
        if (updateError.code === "23514") {
          notify("用户名不符合数据库约束要求，请使用1-15个字符", true);
          return false;
        }
        if (String(updateError.message || "").includes("profiles_username_check")) {
          notify(t.usernameDbConstraintHint, true);
          return false;
        }
        notify(`${t.registerFailed}: ${updateError.message}`, true);
        return false;
      }

      // If no existing row was updated, insert one explicitly.
      if (!updated) {
        let insertResult;
        try {
          insertResult = await withTimeout(
            supabase
              .from(PROFILE_TABLE)
              .insert({ user_id: user.id, username: uname })
              .select("username")
              .single(),
            10000,
          );
        } catch (timeoutError) {
          if (String(timeoutError?.message || "") === "TIMEOUT") {
            notify(t.requestTimeout, true);
            return false;
          }
          throw timeoutError;
        }

        const { data: inserted, error: insertError } = insertResult;

        if (insertError) {
          if (insertError.code === "23505") {
            notify(t.usernameTaken, true);
            return false;
          }
          // 处理数据库约束错误
          if (insertError.code === "23514") {
            notify("用户名不符合数据库约束要求，请使用1-15个字符", true);
            return false;
          }
          if (String(insertError.message || "").includes("profiles_username_check")) {
            notify(t.usernameDbConstraintHint, true);
            return false;
          }
          notify(`${t.registerFailed}: ${insertError.message}`, true);
          return false;
        }

        setUsername(inserted?.username || uname);
      } else {
        setUsername(updated.username || uname);
      }

      notify(t.updateUsernameSuccess, false);
      return true;
    } catch (error) {
      // 简化错误处理，移除锁冲突检查
      notify(`${t.registerFailed}: ${String(error?.message || error)}`, true);
      return false;
    }
  }

  async function handleResetPassword() {
    if (!supabase || !user?.email) {
      notify(t.actionNeedLogin, true);
      return false;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      notify(`${t.registerFailed}: ${error.message}`, true);
      return false;
    }
    notify(t.resetPasswordSent, false);
    return true;
  }

  // 手动同步函数
  async function handleManualSync() {
    if (!supabase || !user) {
      notify(t.actionNeedLogin, true);
      return;
    }
    
    setIsSyncing(true);
    try {
      // 从云端加载数据
      const cloudTodos = await loadTodosForUser(user.id);
      setTodos(cloudTodos);
      writeLocalTodos(storageKey, cloudTodos);
      
      notify("同步成功！", false);
    } catch (error) {
      notify(`同步失败: ${error.message}`, true);
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <main className="container-fluid py-3" style={{ backgroundColor: pageBg, minHeight: "100vh" }}>
      <div className="mx-auto" style={{ maxWidth: "1120px" }}>
        <Toast notice={notice} onClose={() => setNotice({ text: "", warning: false })} />

        <Header
            t={t}
            user={user}
            username={username}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
            lang={lang}
            setLang={setLang}
            clockFormat={clockFormat}
            setClockFormat={setClockFormat}
            onLoginClick={(tab = "login") => {
              setIsAuthModalOpen(true);
              setActiveAuthTab(tab);
            }}
            onLogout={handleLogout}
            onOpenProfileSettings={() => setIsProfileModalOpen(true)}
            onManualSync={handleManualSync}
            isSyncing={isSyncing}
            logoColor={logoColor}
            pageBg={pageBg}
            resolvedTheme={resolvedTheme}
          />

        <TaskManager
          t={t}
          clock={clock}
          pendingTodos={pendingTodos}
          estimateHours={estimateHours}
          filter={filter}
          setFilter={setFilter}
          batchMode={batchMode}
          setBatchMode={setBatchMode}
          selectedIds={selectedIds}
          visibleTodos={visibleTodos}
          onAddTask={openAddTaskModal}
          onOpenPlanWork={() => setIsPlanWorkModalOpen(true)}
          onBatchSelect={setSelectedIds}
          onBatchDone={handleBatchDone}
          onBatchDelete={handleBatchDelete}
          panelBg={panelBg}
          listBg={listBg}
          STATUS_DONE={STATUS_DONE}
          STATUS_PENDING={STATUS_PENDING}
          updateTodo={updateTodo}
          onEditTodo={openEditTodo}
          snapProgress={snapProgress}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          t={t}
          user={user}
          username={username}
          activeAuthTab={activeAuthTab}
          setActiveAuthTab={setActiveAuthTab}
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          onLogin={handleLogin}
          registerUsername={registerUsername}
          setRegisterUsername={setRegisterUsername}
          registerEmail={registerEmail}
          setRegisterEmail={setRegisterEmail}
          registerPassword={registerPassword}
          setRegisterPassword={setRegisterPassword}
          registerConfirmPassword={registerConfirmPassword}
          setRegisterConfirmPassword={setRegisterConfirmPassword}
          onRegister={handleRegister}
          pageBg={pageBg}
        />

        <AddTaskModal
          isOpen={isAddModalOpen}
          onClose={closeAddModal}
          t={t}
          draft={draft}
          setDraft={setDraft}
          onSubmit={handleTaskFormSubmit}
          pageBg={pageBg}
          isEditing={Boolean(editingTodoId)}
          taskLabelOptions={mergedTaskLabels}
          onAddLabelToLibrary={handleAddLabelToLibrary}
          onRequestDelete={() => setConfirmDeleteOpen(true)}
        />

        <ConfirmModal
          isOpen={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          title={t.confirmDeleteTitle}
          message={t.confirmDeleteMessage}
          confirmLabel={t.confirmDelete}
          cancelLabel={t.cancel}
          closeAriaLabel={t.close}
          pageBg={pageBg}
          danger
          onConfirm={confirmDeleteEditingTask}
        />

        <PlanWorkModal
          isOpen={isPlanWorkModalOpen}
          onClose={() => setIsPlanWorkModalOpen(false)}
          t={t}
          todos={todos}
          STATUS_DONE={STATUS_DONE}
          pageBg={pageBg}
        />

        <ProfileSettingsModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          t={t}
          pageBg={pageBg}
          username={username}
          email={user?.email || ""}
          onUpdateEmail={handleUpdateEmail}
          onUpdateUsername={handleUpdateUsername}
          onResetPassword={handleResetPassword}
        />

        <OtpModal
          isOpen={isOtpModalOpen}
          onClose={() => setIsOtpModalOpen(false)}
          t={t}
          otpEmail={otpEmail}
          otpCode={otpCode}
          setOtpCode={setOtpCode}
          onOtpVerify={handleOtpVerify}
          pageBg={pageBg}
        />
      </div>
    </main>
  );
}
