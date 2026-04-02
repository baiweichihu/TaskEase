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
  PomodoroTimer,
  AboutModal,
} from "./components";

// OTP验证模态框组件
function OtpModal({ isOpen, onClose, t, otpEmail, otpCode, setOtpCode, onOtpVerify, isVerifyingOtp, pageBg, themeColors }) {
  if (!isOpen) return null;

  const customInputStyle = {
    backgroundColor: themeColors.listBg,
    borderColor: themeColors.softBtnBorder,
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
                <button
                  className="btn text-dark"
                  type="submit"
                  disabled={isVerifyingOtp}
                  style={{ backgroundColor: themeColors.softBtn, borderColor: themeColors.softBtnBorder }}
                >
                  {t.otpVerify}
                  {isVerifyingOtp ? <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" /> : null}
                </button>
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
const STATUS_DELETED = "deleted";

const GUEST_KEY = "taskease_todos_guest";
const THEME_KEY = "taskease_theme_mode";
const THEME_PRESET_KEY = "taskease_theme_preset";
const CUSTOM_BG_KEY = "taskease_custom_bg";
const LANG_KEY = "taskease_lang";
const CLOCK_KEY = "taskease_clock_format";
const AUTO_SYNC_KEY = "taskease_auto_sync_enabled";
const LAST_SYNC_AT_KEY_PREFIX = "taskease_last_sync_at_";
const PENDING_USERNAME_KEY_PREFIX = "taskease_pending_username_";
const USERNAME_CACHE_KEY_PREFIX = "taskease_username_cache_";
const GUEST_LABELS_KEY = "taskease_task_labels_guest";
const PROJECT_REPO_URL = "https://github.com/baiweichihu/TaskEase";
const SUPABASE_SINGLETON_KEY = "__taskease_supabase_client__";

function getThemeColors(preset, tone) {
  const themes = {
    beige: {
      light: { pageBg: "#efe3cb", panelBg: "#f8eede", listBg: "#faefdf", logoColor: "#6b4f2f", softBtn: "#f2c84b", softBtnBorder: "#e9bd34", activeBtn: "#e0ae1c", activeBtnBorder: "#d39d0c" },
      dark: { pageBg: "#1e2636", panelBg: "#2a3447", listBg: "#334159", logoColor: "#f8e7c4", softBtn: "#f2c84b", softBtnBorder: "#e9bd34", activeBtn: "#d39d0c", activeBtnBorder: "#b8860b" },
    },
    pink: {
      light: { pageBg: "#f8dfe8", panelBg: "#fdeaf1", listBg: "#fff2f7", logoColor: "#7a3f58", softBtn: "#f3b7cc", softBtnBorder: "#e89fb9", activeBtn: "#de88ab", activeBtnBorder: "#cc7098" },
      dark: { pageBg: "#2f2230", panelBg: "#3d2a3d", listBg: "#4a3550", logoColor: "#ffd9e8", softBtn: "#f3b7cc", softBtnBorder: "#e89fb9", activeBtn: "#d785a8", activeBtnBorder: "#bd678f" },
    },
    blue: {
      light: { pageBg: "#deebf8", panelBg: "#eaf3fc", listBg: "#f2f8ff", logoColor: "#2f5675", softBtn: "#9fc7eb", softBtnBorder: "#84b8e3", activeBtn: "#6fa7dd", activeBtnBorder: "#4b8fcf" },
      dark: { pageBg: "#1f2b3a", panelBg: "#27384b", listBg: "#32465f", logoColor: "#d8ebff", softBtn: "#9fc7eb", softBtnBorder: "#84b8e3", activeBtn: "#659ece", activeBtnBorder: "#4a84b4" },
    },
    lavender: {
      light: { pageBg: "#ebe3f6", panelBg: "#f3ecfb", listBg: "#f8f4fe", logoColor: "#5e4b7a", softBtn: "#cab3e8", softBtnBorder: "#b9a0de", activeBtn: "#ab8fd4", activeBtnBorder: "#977ac4" },
      dark: { pageBg: "#242437", panelBg: "#2f2f45", listBg: "#3a3a57", logoColor: "#eadfff", softBtn: "#cab3e8", softBtnBorder: "#b9a0de", activeBtn: "#a68ace", activeBtnBorder: "#8f72b9" },
    },
    "custom-bg": {
      light: { pageBg: "rgba(255, 255, 255, 0.16)", panelBg: "rgba(255, 255, 255, 0.26)", listBg: "rgba(255, 255, 255, 0.2)", logoColor: "#ffffff", softBtn: "rgba(255, 255, 255, 0.58)", softBtnBorder: "rgba(255, 255, 255, 0.72)", activeBtn: "rgba(255, 255, 255, 0.78)", activeBtnBorder: "rgba(255, 255, 255, 0.9)" },
      dark: { pageBg: "rgba(255, 255, 255, 0.16)", panelBg: "rgba(255, 255, 255, 0.26)", listBg: "rgba(255, 255, 255, 0.2)", logoColor: "#ffffff", softBtn: "rgba(255, 255, 255, 0.58)", softBtnBorder: "rgba(255, 255, 255, 0.72)", activeBtn: "rgba(255, 255, 255, 0.78)", activeBtnBorder: "rgba(255, 255, 255, 0.9)" },
    },
  };

  const safePreset = Object.prototype.hasOwnProperty.call(themes, preset) ? preset : "beige";
  const safeTone = tone === "dark" ? "dark" : "light";
  return themes[safePreset][safeTone];
}

const TEXT = {
  "zh-CN": {
    appTitle: "TaskEase",
    settings: "设置",
    themePalette: "主题",
    themeBeige: "米黄",
    themePink: "粉色",
    themeBlue: "浅蓝",
    themeLavender: "淡紫",
    themeCustomBg: "自定义背景",
    customBgInput: "背景图片 URL",
    customBgPlaceholder: "输入图片链接，留空则用默认渐变背景",
    customBgReset: "清除背景",
    customBgLocalOnly: "仅本地可见，不上传云端",
    customBgLocalFile: "本地文件",
    customBgSort: "排序",
    customBgSortTime: "上传时间",
    customBgSortName: "文件名",
    customBgEmpty: "暂无背景，点击\"+\"按钮添加",
    customBgAddNew: "添加文件",
    or: "或者",
    confirm: "确定",
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
    save: "保存",
    all: "全部",
    active: "进行中",
    done: "已完成",
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
    supabaseMissing: "Supabase 未连接。",
    invalidLogin: "请输入有效邮箱和密码。",
    loginFailed: "登录失败，请检查邮箱或密码。",
    loginSuccess: "登录成功。",
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
    addSuccess: "任务已添加。",
    duplicateTaskTitle: "检测到重复任务",
    duplicateTaskMessage: "已存在相同标题和截止时间的任务。确定仍要添加吗？",
    duplicateTaskConfirm: "仍然添加",
    viewNormal: "默认视图",
    viewByDue: "截止排序",
    viewByPriority: "优先级排序",
    viewCalendar: "日历视图",
    viewDueNoDdl: "未设置截止时间（按创建时间）",
    viewDueHasDdl: "已设置截止时间（按截止时间）",
    calendarPrev: "上月",
    calendarNext: "下月",
    calendarWeekdays: ["日", "一", "二", "三", "四", "五", "六"],
    calendarSideTitle: "当天任务",
    calendarNoTasks: "当天暂无任务",
    calendarDragHint: "可将任务拖到日期格，快速调整日期。",
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
    tagAddNew: "＋新增",
    newTagPrompt: "新标签名称",
    tagNone: "无",
    optionalPlaceholder: "选填",
    progress: "进度",
    remHours: "预计剩余时长",
    remarkPrefix: "备注: ",
    taskComplete: "完成",
    taskCompletedState: "已完成",
    taskReopen: "退回",
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
    autoSyncLabel: "自动同步",
    autoSyncOn: "开启",
    autoSyncOff: "关闭",
    autoSyncEnabledNotice: "自动同步已开启（每5分钟）。",
    autoSyncDisabledNotice: "自动同步已关闭。",
    syncSuccess: "同步成功。",
    syncNeedLogin: "当前会话不可用，请重新登录后再同步。",
    syncFailed: "同步失败",
    syncBusyPrefix: "同步被占用，当前持有者",
    syncing: "同步中...",
    syncNow: "云同步",
    submitting: "提交中...",
    migrateLocalTitle: "检测到本地数据",
    migrateLocalMessage: "当前账号云端任务为空，但本地有任务。是否将本地任务、背景和偏好迁移到当前账号？",
    migrateLocalConfirm: "迁移并清理本地",
    migrateLocalSuccess: "本地数据已迁移到当前账号。",
    migrateLocalFailed: "迁移失败",
    editPrompt: "编辑任务",
    titlePlaceholder: "任务标题",
    estHours: "预计任务时长",
    dueAt: "截止时间",
    dueTimeDefaultHint: "若时间栏留空则默认为当日23:59。",
    label: "标签",
    priority: "优先级",
    priorityOpt0: "0（未指定）",
    priorityOpt1: "1（最优先）",
    priorityOpt2: "2（次优先）",
    priorityOpt3: "3（不是很优先）",
    repeat: "重复",
    repeatNone: "不重复",
    repeatDaily: "每天",
    repeatWeekly: "每周",
    repeatMonthly: "每月",
    repeatUntilDate: "重复截止日期",
    repeatUntilHint: "按天设置，最长 365 天。",
    repeatUntilRequired: "请设置重复截止日期。",
    repeatUntilBeforeStart: "重复截止日期不能早于开始日期。",
    repeatUntilMaxDaysError: "重复期限最多 365 天。",
    recurrenceCreateFallback: "重复任务已添加到本地，云端写入失败。",
    aboutUs: "关于我们",
    aboutSummary: "TaskEase 是一个现代化任务管理网页，帮助你更高效地安排每日工作。",
    aboutFeatureAuth: "支持账号注册登录与个人数据隔离。",
    aboutFeatureCalendar: "提供日历视图和拖拽改期。",
    aboutFeatureRecurring: "支持每日/每周/每月重复任务。",
    aboutFeatureSync: "支持本地存储与 Supabase 云同步。",
    aboutFeatureI18n: "支持简体中文、繁体中文与英文。",
    aboutRepo: "GitHub 仓库",
    remark: "备注",
    weekdays: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
  },
  "zh-TW": {
    appTitle: "TaskEase",
    settings: "設定",
    themePalette: "主題",
    themeBeige: "米黃",
    themePink: "粉色",
    themeBlue: "淺藍",
    themeLavender: "淡紫",
    themeCustomBg: "自訂背景",
    customBgInput: "背景圖片 URL",
    customBgPlaceholder: "輸入圖片連結，留空則使用預設漸層背景",
    customBgReset: "清除背景",
    customBgLocalOnly: "僅本地可見，不上傳雲端",
    customBgLocalFile: "本機檔案",
    customBgSort: "排序",
    customBgSortTime: "上傳時間",
    customBgSortName: "檔名",
    customBgEmpty: "尚無背景，點擊\"+\"按鈕新增",
    customBgAddNew: "新增檔案",
    or: "或",
    confirm: "確定",
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
    save: "儲存",
    all: "全部",
    active: "進行中",
    done: "已完成",
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
    supabaseMissing: "Supabase 未連線。",
    invalidLogin: "請輸入有效電子郵件與密碼。",
    loginFailed: "登入失敗，請檢查電子郵件或密碼。",
    loginSuccess: "登入成功。",
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
    addSuccess: "任務已新增。",
    duplicateTaskTitle: "偵測到重複任務",
    duplicateTaskMessage: "已存在相同標題與截止時間的任務。仍要新增嗎？",
    duplicateTaskConfirm: "仍然新增",
    viewNormal: "預設檢視",
    viewByDue: "截止排序",
    viewByPriority: "優先級排序",
    viewCalendar: "日曆檢視",
    viewDueNoDdl: "未設定截止時間（依建立時間）",
    viewDueHasDdl: "已設定截止時間（依截止時間）",
    calendarPrev: "上月",
    calendarNext: "下月",
    calendarWeekdays: ["日", "一", "二", "三", "四", "五", "六"],
    calendarSideTitle: "當天任務",
    calendarNoTasks: "當天暫無任務",
    calendarDragHint: "可將任務拖到日期格，快速調整日期。",
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
    tagAddNew: "＋新增",
    newTagPrompt: "新標籤名稱",
    tagNone: "無",
    progress: "進度",
    remHours: "預計剩餘時長",
    remarkPrefix: "備註: ",
    taskComplete: "完成",
    taskCompletedState: "已完成",
    taskReopen: "退回",
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
    autoSyncLabel: "自動同步",
    autoSyncOn: "開啟",
    autoSyncOff: "關閉",
    autoSyncEnabledNotice: "自動同步已開啟（每5分鐘）。",
    autoSyncDisabledNotice: "自動同步已關閉。",
    syncSuccess: "同步成功。",
    syncNeedLogin: "目前會話不可用，請重新登入後再同步。",
    syncFailed: "同步失敗",
    syncBusyPrefix: "同步被占用，目前持有者",
    syncing: "同步中...",
    syncNow: "雲端同步",
    submitting: "提交中...",
    migrateLocalTitle: "偵測到本機資料",
    migrateLocalMessage: "目前帳號雲端任務為空，但本機有任務。要將本機任務、背景與偏好遷移到此帳號嗎？",
    migrateLocalConfirm: "遷移並清理本機",
    migrateLocalSuccess: "本機資料已遷移到目前帳號。",
    migrateLocalFailed: "遷移失敗",
    editPrompt: "編輯任務",
    titlePlaceholder: "任務標題",
    estHours: "預計任務時長",
    dueAt: "截止時間",
    dueTimeDefaultHint: "若時間欄留空則預設為當日23:59。",
    label: "標籤",
    priority: "優先級",
    priorityOpt0: "0（未指定）",
    priorityOpt1: "1（最優先）",
    priorityOpt2: "2（次優先）",
    priorityOpt3: "3（不是很優先）",
    repeat: "重複",
    repeatNone: "不重複",
    repeatDaily: "每天",
    repeatWeekly: "每週",
    repeatMonthly: "每月",
    repeatUntilDate: "重複截止日期",
    repeatUntilHint: "以天為單位，最長 365 天。",
    repeatUntilRequired: "請設定重複截止日期。",
    repeatUntilBeforeStart: "重複截止日期不能早於開始日期。",
    repeatUntilMaxDaysError: "重複期限最多 365 天。",
    recurrenceCreateFallback: "重複任務已新增到本機，雲端寫入失敗。",
    aboutUs: "關於我們",
    aboutSummary: "TaskEase 是一個現代化任務管理網頁，幫助你更有效率地安排每日工作。",
    aboutFeatureAuth: "支援帳號註冊登入與個人資料隔離。",
    aboutFeatureCalendar: "提供日曆檢視與拖曳改期。",
    aboutFeatureRecurring: "支援每日/每週/每月重複任務。",
    aboutFeatureSync: "支援本機儲存與 Supabase 雲端同步。",
    aboutFeatureI18n: "支援簡體中文、繁體中文與英文。",
    aboutRepo: "GitHub 倉庫",
    remark: "備註",
    weekdays: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
  },
  en: {
    appTitle: "TaskEase",
    settings: "Settings",
    themePalette: "Theme",
    themeBeige: "Beige",
    themePink: "Pink",
    themeBlue: "Light Blue",
    themeLavender: "Lavender",
    themeCustomBg: "Custom BG",
    customBgInput: "Background image URL",
    customBgPlaceholder: "Paste an image URL, or leave empty for default gradient",
    customBgReset: "Clear background",
    customBgLocalOnly: "Local only, not uploaded to cloud",
    customBgLocalFile: "Local file",
    customBgSort: "Sort",
    customBgSortTime: "Upload time",
    customBgSortName: "File name",
    customBgEmpty: "No backgrounds yet. Click \"+\" to add one.",
    customBgAddNew: "Add file",
    or: "or",
    confirm: "Confirm",
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
    save: "Save",
    all: "All",
    active: "Active",
    done: "Completed",
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
    supabaseMissing: "Supabase unavailable.",
    invalidLogin: "Please enter a valid email and password.",
    loginFailed: "Login failed. Check email/password.",
    loginSuccess: "Login successful.",
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
    addSuccess: "Task added.",
    duplicateTaskTitle: "Duplicate Task Detected",
    duplicateTaskMessage: "A task with the same title and due time already exists. Add it anyway?",
    duplicateTaskConfirm: "Add Anyway",
    viewNormal: "Default View",
    viewByDue: "Due Sort",
    viewByPriority: "Priority Sort",
    viewCalendar: "Calendar",
    viewDueNoDdl: "No Due Time (Created Earliest First)",
    viewDueHasDdl: "With Due Time (Nearest Due First)",
    calendarPrev: "Prev",
    calendarNext: "Next",
    calendarWeekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    calendarSideTitle: "Tasks On Date",
    calendarNoTasks: "No tasks on this date",
    calendarDragHint: "Drag tasks to a date cell to reschedule quickly.",
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
    tagAddNew: "+ New",
    newTagPrompt: "New label name",
    tagNone: "None",
    optionalPlaceholder: "Optional",
    progress: "Progress",
    remHours: "Estimated remaining duration",
    remarkPrefix: "Note: ",
    taskComplete: "Done",
    taskCompletedState: "Completed",
    taskReopen: "Reopen",
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
    autoSyncLabel: "Auto Sync",
    autoSyncOn: "On",
    autoSyncOff: "Off",
    autoSyncEnabledNotice: "Auto sync enabled (every 5 minutes).",
    autoSyncDisabledNotice: "Auto sync disabled.",
    syncSuccess: "Sync completed.",
    syncNeedLogin: "Session is invalid. Please sign in again before syncing.",
    syncFailed: "Sync failed",
    syncBusyPrefix: "Sync is locked by",
    syncing: "Syncing...",
    syncNow: "Cloud sync",
    submitting: "Submitting...",
    migrateLocalTitle: "Local Data Found",
    migrateLocalMessage: "This account has no cloud tasks, but local tasks exist. Move local tasks, background, and preferences into this account?",
    migrateLocalConfirm: "Migrate and Clear Local",
    migrateLocalSuccess: "Local data migrated to this account.",
    migrateLocalFailed: "Migration failed",
    editPrompt: "Edit task",
    titlePlaceholder: "Task title",
    estHours: "Estimated task duration",
    dueAt: "Due time",
    dueTimeDefaultHint: "If time is left empty, it defaults to 23:59 on that date.",
    label: "Label",
    priority: "Priority",
    priorityOpt0: "0 (Unspecified)",
    priorityOpt1: "1 (Highest)",
    priorityOpt2: "2 (High)",
    priorityOpt3: "3 (Lower)",
    repeat: "Repeat",
    repeatNone: "None",
    repeatDaily: "Daily",
    repeatWeekly: "Weekly",
    repeatMonthly: "Monthly",
    repeatUntilDate: "Repeat until",
    repeatUntilHint: "Set by day, up to 365 days.",
    repeatUntilRequired: "Please set a repeat end date.",
    repeatUntilBeforeStart: "Repeat end date cannot be earlier than start date.",
    repeatUntilMaxDaysError: "Repeat duration can be at most 365 days.",
    recurrenceCreateFallback: "Recurring task added locally, cloud insert failed.",
    aboutUs: "About",
    aboutSummary: "TaskEase is a modern task management web app that helps you organize daily work efficiently.",
    aboutFeatureAuth: "Account sign up/login with per-user data isolation.",
    aboutFeatureCalendar: "Calendar view with drag-to-reschedule.",
    aboutFeatureRecurring: "Daily/weekly/monthly recurring tasks.",
    aboutFeatureSync: "Local storage with optional Supabase cloud sync.",
    aboutFeatureI18n: "Supports Simplified Chinese, Traditional Chinese, and English.",
    aboutRepo: "GitHub Repository",
    remark: "Remark",
    weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  },
};

const supabase = buildSupabaseClient();

function buildSupabaseClient() {
  const valid = /^https:\/\/.+\.supabase\.co$/i.test(SUPABASE_URL.trim()) && SUPABASE_KEY.trim();
  if (!valid) return null;
  try {
    const globalScope = globalThis;
    if (globalScope[SUPABASE_SINGLETON_KEY]) {
      return globalScope[SUPABASE_SINGLETON_KEY];
    }

    const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        storageKey: "taskease-auth-token",
      },
    });

    globalScope[SUPABASE_SINGLETON_KEY] = client;
    return client;
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
  return (
    message.includes("Lock broken by another request") ||
    message.includes("AbortError") ||
    message.includes("NavigatorLockAcquireTimeoutError") ||
    message.includes("was not released within") ||
    message.includes("lock:")
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withLockRetry(task, retries = 1, waitMs = 220) {
  try {
    return await task();
  } catch (error) {
    if (retries > 0 && isTransientLockError(error)) {
      await sleep(waitMs);
      return withLockRetry(task, retries - 1, waitMs);
    }
    throw error;
  }
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
    return parsed.map((item) => {
      const parsedRepeat = parseRemarkAndRepeat(item?.remark ?? "");
      return {
        ...item,
        remark: parsedRepeat.remark,
        repeat_rule: normalizeRepeatRule(item?.repeat_rule ?? parsedRepeat.repeat_rule),
        progress_percent: snapProgress(item?.progress_percent),
        estimated_hours: Number(item?.estimated_hours ?? 0),
        priority: Number(item?.priority ?? 0),
      };
    });
  } catch {
    return [];
  }
}

function writeLocalTodos(key, todos) {
  localStorage.setItem(key, JSON.stringify(todos));
}

function getLastSyncAt(userId) {
  const id = String(userId || "").trim();
  if (!id) return "";
  return String(localStorage.getItem(`${LAST_SYNC_AT_KEY_PREFIX}${id}`) || "").trim();
}

function setLastSyncAt(userId, value) {
  const id = String(userId || "").trim();
  const ts = String(value || "").trim();
  if (!id || !ts) return;
  localStorage.setItem(`${LAST_SYNC_AT_KEY_PREFIX}${id}`, ts);
}

function readAllLocalTodos() {
  try {
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;
      if (key === GUEST_KEY || key.startsWith("taskease_todos_")) keys.push(key);
    }
    return mergeTodoLists(...keys.map((key) => readLocalTodos(key)));
  } catch {
    return [];
  }
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

function getCachedUsernameByUserId(userId) {
  const id = String(userId || "").trim();
  if (!id) return "";
  return String(localStorage.getItem(`${USERNAME_CACHE_KEY_PREFIX}${id}`) || "").trim();
}

function setCachedUsernameByUserId(userId, username) {
  const id = String(userId || "").trim();
  const name = String(username || "").trim();
  if (!id || !name) return;
  localStorage.setItem(`${USERNAME_CACHE_KEY_PREFIX}${id}`, name);
}

function resolveFastUsername(currentUser) {
  const cached = getCachedUsernameByUserId(currentUser?.id);
  if (cached) return cached;

  const metaName = normalizeUsername(currentUser?.user_metadata?.username || "");
  if (isValidUsername(metaName)) return metaName;

  const pendingName = normalizeUsername(getPendingUsernameByEmail(currentUser?.email || ""));
  if (isValidUsername(pendingName)) return pendingName;

  return "user";
}

function snapProgress(v) {
  const x = Number(v);
  if (!Number.isFinite(x)) return 0;
  const c = Math.round(x / 10) * 10;
  return Math.max(0, Math.min(100, c));
}

function toDatetimeLocalValue(iso) {
  if (iso == null) return "";
  const raw = String(iso).trim();
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateAndTimeLocalParts(iso) {
  const value = toDatetimeLocalValue(iso);
  if (!value || !value.includes("T")) return { date: "", time: "" };
  const [date, time] = value.split("T");
  return { date: date || "", time: time || "" };
}

function buildDueIso(dateValue, timeValue) {
  const date = String(dateValue || "").trim();
  if (!date) return null;
  const time = String(timeValue || "").trim() || "23:59";
  const d = new Date(`${date}T${time}`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

const REPEAT_MARKER_REGEX = /\[repeat:(none|daily|weekly|monthly)\]/gi;
const REPEAT_UNTIL_MARKER_REGEX = /\[repeat-until:(\d{4}-\d{2}-\d{2})\]/gi;

function normalizeRepeatRule(rule) {
  const value = String(rule || "none").trim().toLowerCase();
  if (value === "daily" || value === "weekly" || value === "monthly") return value;
  return "none";
}

function normalizeRepeatUntilDate(dateValue) {
  const value = String(dateValue || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toDateKeyFromIso(value) {
  const d = new Date(value || "");
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseRemarkAndRepeat(rawRemark) {
  const value = String(rawRemark || "");
  const repeatMatch = [...value.matchAll(REPEAT_MARKER_REGEX)].pop();
  const untilMatch = [...value.matchAll(REPEAT_UNTIL_MARKER_REGEX)].pop();
  const repeat_rule = normalizeRepeatRule(repeatMatch?.[1] || "none");
  const repeat_until_date = normalizeRepeatUntilDate(untilMatch?.[1] || "");
  const remark = value.replace(REPEAT_MARKER_REGEX, "").replace(REPEAT_UNTIL_MARKER_REGEX, "").trim();
  return { remark, repeat_rule, repeat_until_date };
}

function composeRemarkAndRepeat(rawRemark, repeatRule, repeatUntilDate = "") {
  const repeat = normalizeRepeatRule(repeatRule);
  const until = normalizeRepeatUntilDate(repeatUntilDate);
  const plainRemark = String(rawRemark || "")
    .replace(REPEAT_MARKER_REGEX, "")
    .replace(REPEAT_UNTIL_MARKER_REGEX, "")
    .trim();
  if (repeat === "none") return plainRemark;
  if (until) return `${plainRemark} [repeat:${repeat}] [repeat-until:${until}]`.trim();
  return `${plainRemark} [repeat:${repeat}]`.trim();
}

function getNextRecurringDdl(ddl, repeatRule) {
  const rule = normalizeRepeatRule(repeatRule);
  if (rule === "none" || !ddl) return null;
  const base = new Date(ddl);
  if (Number.isNaN(base.getTime())) return null;

  const next = new Date(base);
  if (rule === "daily") next.setDate(base.getDate() + 1);
  else if (rule === "weekly") next.setDate(base.getDate() + 7);
  else if (rule === "monthly") next.setMonth(base.getMonth() + 1);

  return next.toISOString();
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
  const rawStatus = String(row.status ?? STATUS_PENDING).trim();
  const status = rawStatus === STATUS_DELETED ? STATUS_DELETED : rawStatus;
  const { remark, repeat_rule, repeat_until_date } = parseRemarkAndRepeat(row.remark ?? "");
  return {
    id: row.id,
    title: row.title || "",
    status,
    estimated_hours: Number(row.estimated_hours ?? 0),
    ddl: row.ddl ?? null,
    remark,
    repeat_rule,
    repeat_until_date,
    priority: Number(row.priority ?? 0),
    label: row.label ?? "",
    progress_percent: snapProgress(row.progress_percent ?? 0),
    user_id: row.user_id,
    created_at: row.created_at,
    local_dirty: Boolean(row.local_dirty),
    local_updated_at: row.local_updated_at || "",
    deleted_at: row.deleted_at || "",
  };
}

function isTodoLocallyDirtyOrNew(todo, lastSyncAt) {
  if (!todo || typeof todo !== "object") return false;
  if (todo.status === STATUS_DELETED) return true;
  if (todo.local_dirty) return true;
  const localUpdatedAt = String(todo.local_updated_at || "").trim();
  if (localUpdatedAt && (!lastSyncAt || localUpdatedAt > lastSyncAt)) return true;
  const createdAt = String(todo.created_at || "").trim();
  if (createdAt && (!lastSyncAt || createdAt > lastSyncAt)) return true;
  return false;
}

function toTs(value, fallback = 0) {
  const ts = new Date(value || "").getTime();
  return Number.isFinite(ts) ? ts : fallback;
}

function mergeTodoLists(...lists) {
  const merged = new Map();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const todo of list) {
      if (!todo || !todo.id) continue;
      merged.set(todo.id, { ...merged.get(todo.id), ...todo });
    }
  }
  return Array.from(merged.values()).sort((a, b) => toTs(b.created_at) - toTs(a.created_at));
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
  const OP_TIMEOUT_MS = 10000;
  const SUBMIT_WATCHDOG_MS = 12000;

  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "zh-CN" || saved === "zh-TW" || saved === "en") return saved;
    return "zh-CN";
  });
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  });
  const [themePreset, setThemePreset] = useState(() => {
    const saved = localStorage.getItem(THEME_PRESET_KEY);
    return saved === "beige" || saved === "pink" || saved === "blue" || saved === "lavender" || saved === "custom-bg"
      ? saved
      : "beige";
  });
  const [customBackground, setCustomBackground] = useState(() => localStorage.getItem(CUSTOM_BG_KEY) || "");
  const [clockFormat, setClockFormat] = useState(() => {
    const saved = localStorage.getItem(CLOCK_KEY);
    return saved === "12h" || saved === "24h" ? saved : "24h";
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    const saved = localStorage.getItem(AUTO_SYNC_KEY);
    return saved === "true";
  });

  const [resolvedTheme, setResolvedTheme] = useState("light");
  const [now, setNow] = useState(() => new Date());

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPlanWorkModalOpen, setIsPlanWorkModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isMigratePromptOpen, setIsMigratePromptOpen] = useState(false);
  const [activeAuthTab, setActiveAuthTab] = useState("login");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMigratingLocalData, setIsMigratingLocalData] = useState(false);

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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");

  const [notice, setNotice] = useState({ text: "", warning: false });

  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("normal");

  const [draft, setDraft] = useState({
    title: "",
    estimated_hours: "",
    ddlDate: "",
    ddlTime: "",
    label: "",
    priority: "",
    repeat_rule: "none",
    repeat_until_date: "",
    remark: "",
  });

  const [editingTodoId, setEditingTodoId] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const [pendingDuplicatePayload, setPendingDuplicatePayload] = useState(null);
  const [taskLabels, setTaskLabels] = useState([]);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const previousUserIdRef = useRef(null);
  const authSyncSeqRef = useRef(0);
  const autoSyncInFlightRef = useRef(false);
  const syncGuardRef = useRef({ owner: "", startedAt: 0, token: "" });
  const migrationPromptShownForUserRef = useRef(null);
  const ignoreAuthEventsUntilRef = useRef(0);
  const isLogoutInProgressRef = useRef(false);

  const [todos, setTodos] = useState([]);
  const [timerTaskId, setTimerTaskId] = useState(null);
  const currentTimerTask = timerTaskId ? todos.find((t) => t.id === timerTaskId) : null;

  const t = TEXT[lang];
  const storageKey = user ? `taskease_todos_${user.id}` : GUEST_KEY;

  const isCustomBgTheme = themePreset === "custom-bg";
  const paletteTone = isCustomBgTheme ? "light" : resolvedTheme;
  const themeColors = getThemeColors(themePreset, paletteTone);
  const { pageBg, panelBg, listBg, logoColor } = themeColors;

  function notify(text, warning = true) {
    setNotice({ text, warning });
    window.setTimeout(() => {
      setNotice((prev) => (prev.text === text ? { text: "", warning: false } : prev));
    }, 4500);
  }

  function tryAcquireSyncGuard(source) {
    const now = Date.now();
    const current = syncGuardRef.current;
    if (current?.token) {
      return {
        ok: false,
        holder: current.owner || "unknown",
        elapsedMs: Math.max(0, now - Number(current.startedAt || now)),
        token: "",
      };
    }
    const token = `${source}-${now}-${Math.random().toString(36).slice(2, 8)}`;
    syncGuardRef.current = { owner: source, startedAt: now, token };
    return { ok: true, holder: source, elapsedMs: 0, token };
  }

  function releaseSyncGuard(token) {
    const current = syncGuardRef.current;
    if (!current?.token || current.token !== token) return;
    syncGuardRef.current = { owner: "", startedAt: 0, token: "" };
  }

  function pushDiag() {
    // diagnostics disabled by request
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

    const next = isCustomBgTheme ? "light" : resolve(themeMode);
    setResolvedTheme(next);
    document.documentElement.setAttribute("data-bs-theme", next);
    localStorage.setItem(THEME_KEY, themeMode);
  }, [themeMode, isCustomBgTheme]);

  useEffect(() => {
    localStorage.setItem(THEME_PRESET_KEY, themePreset);
  }, [themePreset]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_BG_KEY, customBackground);
  }, [customBackground]);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(CLOCK_KEY, clockFormat);
  }, [clockFormat]);

  useEffect(() => {
    localStorage.setItem(AUTO_SYNC_KEY, autoSyncEnabled ? "true" : "false");
  }, [autoSyncEnabled]);

  useEffect(() => {
    if (themeMode !== "system" || isCustomBgTheme) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const next = media.matches ? "dark" : "light";
      setResolvedTheme(next);
      document.documentElement.setAttribute("data-bs-theme", next);
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [themeMode, isCustomBgTheme]);

  useEffect(() => {
    if (!supabase) {
      notify(t.localOnly, true);
      setTodos(readAllLocalTodos());
      return;
    }

    setTodos(readAllLocalTodos());

    let mounted = true;

    async function applySession(current, event = "UNKNOWN") {
      const seq = ++authSyncSeqRef.current;
      pushDiag("authSync", "start", { event, seq, hasUser: Boolean(current), userId: current?.id || null });

      if (current && Date.now() < ignoreAuthEventsUntilRef.current) {
        pushDiag("authSync", "ignored_during_forced_logout", { event, seq, userId: current.id }, "warn");
        return;
      }

      setUser(current);

      if (!current) {
        pushDiag("authSync", "no_user_reset", { event, seq });
        isLogoutInProgressRef.current = false;
        ignoreAuthEventsUntilRef.current = 0;
        setUsername("");
        setTodos(readAllLocalTodos());
        previousUserIdRef.current = null;
        autoSyncInFlightRef.current = false;
        setIsMigratePromptOpen(false);
        migrationPromptShownForUserRef.current = null;
        return;
      }

      if (isLogoutInProgressRef.current) {
        pushDiag("authSync", "ignored_logout_in_progress", { event, seq, userId: current.id }, "warn");
        return;
      }

      const switchedUser = previousUserIdRef.current !== current.id;
      if (switchedUser) {
        previousUserIdRef.current = current.id;
      }

      // Show a fast local username first so UI does not appear blank when cloud is slow.
      const fastName = resolveFastUsername(current);
      setUsername(fastName);
      pushDiag("authSync", "username_fast_resolved", { seq, userId: current.id, fastName });

      // Avoid repeating heavy profile/todo fetches on token refresh for same user.
      if (!switchedUser && event === "TOKEN_REFRESHED") {
        pushDiag("authSync", "skip_token_refreshed", { event, seq, userId: current.id });
        return;
      }

      try {
        pushDiag("authSync", "username_load_start", { seq, userId: current.id });
        const foundName = await withTimeout(loadOrCreateUsername(current), OP_TIMEOUT_MS);
        if (!mounted || seq !== authSyncSeqRef.current) return;
        pushDiag("authSync", "username_load_success", { seq, userId: current.id, foundName: foundName || fastName || "user" });
        setUsername(foundName || fastName || "user");
      } catch (err) {
        if (!mounted || seq !== authSyncSeqRef.current) return;
        const isTimeout = String(err?.message || "") === "TIMEOUT";
        pushDiag(
          "authSync",
          isTimeout ? "username_load_timeout" : "username_load_error",
          { seq, userId: current.id, error: String(err?.message || err) },
          "error",
        );
        setUsername(fastName || "user");
      }

      try {
        pushDiag("authSync", "preferences_load_start", { seq, userId: current.id });
        await withTimeout(loadPreferences(current.id), OP_TIMEOUT_MS);
        pushDiag("authSync", "preferences_load_success", { seq, userId: current.id });
      } catch (err) {
        const isTimeout = String(err?.message || "") === "TIMEOUT";
        pushDiag(
          "authSync",
          isTimeout ? "preferences_load_timeout" : "preferences_load_error",
          { seq, userId: current.id, error: String(err?.message || err) },
          "warn",
        );
      }

      if (!mounted || seq !== authSyncSeqRef.current) return;

      const localOnlyTodos = mergeTodoLists(readLocalTodos(`taskease_todos_${current.id}`), readLocalTodos(GUEST_KEY));
      pushDiag("authSync", "todos_load_local_only", { seq, userId: current.id, count: localOnlyTodos.length });
      setTodos(localOnlyTodos);
      writeLocalTodos(`taskease_todos_${current.id}`, localOnlyTodos);

      if (
        localOnlyTodos.length === 0 &&
        readLocalTodos(GUEST_KEY).length > 0 &&
        migrationPromptShownForUserRef.current !== current.id
      ) {
        migrationPromptShownForUserRef.current = current.id;
        setIsMigratePromptOpen(true);
        pushDiag("migration", "prompt_open", { userId: current.id, guestCount: readLocalTodos(GUEST_KEY).length });
      }

      if (!mounted || seq !== authSyncSeqRef.current) return;
      pushDiag("authSync", "done", { seq, userId: current.id });
    }

    async function initSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        await applySession(session?.user ?? null, "INITIAL_GET_SESSION");
      } catch (error) {
        if (!mounted) return;
        if (!isTransientLockError(error)) {
          pushDiag("authSync", "init_session_error", { error: String(error?.message || error) }, "warn");
        }
      }
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        await applySession(session?.user ?? null, event);
      } catch (error) {
        if (!isTransientLockError(error)) {
          pushDiag("authSync", "auth_listener_error", { event, error: String(error?.message || error) }, "warn");
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
    if (!supabase || !user || !autoSyncEnabled) return;
    const timer = window.setInterval(() => {
      void performCloudSync("auto");
    }, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [supabase, user, autoSyncEnabled, lang, clockFormat, themeMode, taskLabels]);

  const visibleTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (todo.status === STATUS_DELETED) return false;
      if (filter === "active") return todo.status !== STATUS_DONE;
      if (filter === "done") return todo.status === STATUS_DONE;
      return true;
    });
  }, [todos, filter]);

  const pendingTodos = useMemo(
    () => todos.filter((item) => item.status !== STATUS_DONE && item.status !== STATUS_DELETED),
    [todos],
  );

  const estimateHours = useMemo(() => {
    const sum = pendingTodos.reduce((acc, item) => acc + Number(item.estimated_hours || 0), 0);
    return Number.isFinite(sum) ? sum.toFixed(1) : "0.0";
  }, [pendingTodos]);

  const mergedTaskLabels = useMemo(() => {
    const fromTodos = todos
      .filter((x) => x.status !== STATUS_DELETED)
      .map((x) => String(x.label || "").trim())
      .filter(Boolean);
    const set = new Set([...taskLabels.map((x) => String(x).trim()).filter(Boolean), ...fromTodos]);
    return Array.from(set).sort((a, b) => a.localeCompare(b, lang));
  }, [todos, taskLabels, lang]);

  const clock = getClockParts(now, lang, clockFormat);

  async function loadTodosForUser(userId, options = {}) {
    const { includeLocal = true } = options;
    if (!supabase || !userId) return readLocalTodos(GUEST_KEY);

    const localUserTodos = readLocalTodos(`taskease_todos_${userId}`);
    const guestTodos = readLocalTodos(GUEST_KEY);

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
      return includeLocal ? mergeTodoLists(guestTodos, localUserTodos) : [];
    }

    const cloudMapped = (Array.isArray(data) ? data : []).map(mapTodo);
    return includeLocal ? mergeTodoLists(cloudMapped, guestTodos, localUserTodos) : cloudMapped;
  }

  async function loadPreferences(userId) {
    let data = null;
    let error = null;

    ({ data, error } = await supabase
      .from(PREFERENCES_TABLE)
      .select("language,clock_format,theme_mode,task_labels,auto_sync_enabled,theme_preset,custom_background")
      .eq("user_id", userId)
      .maybeSingle());

    if (error && String(error.message || "").toLowerCase().includes("column")) {
      ({ data } = await supabase
        .from(PREFERENCES_TABLE)
        .select("language,clock_format,theme_mode,task_labels,auto_sync_enabled")
        .eq("user_id", userId)
        .maybeSingle());
    }

    if (!data) return;
    if (data.language && (data.language === "zh-CN" || data.language === "zh-TW" || data.language === "en")) setLang(data.language);
    if (data.clock_format && (data.clock_format === "12h" || data.clock_format === "24h")) setClockFormat(data.clock_format);
    if (data.theme_mode && (data.theme_mode === "light" || data.theme_mode === "dark" || data.theme_mode === "system")) setThemeMode(data.theme_mode);
    if (data.task_labels !== undefined && data.task_labels !== null) {
      setTaskLabels(parseTaskLabels(data.task_labels));
    }
    if (typeof data.auto_sync_enabled === "boolean") {
      setAutoSyncEnabled(data.auto_sync_enabled);
    }
    if (data.theme_preset && ["beige", "pink", "blue", "lavender", "custom-bg"].includes(data.theme_preset)) {
      setThemePreset(data.theme_preset);
    }
    if (typeof data.custom_background === "string") {
      setCustomBackground(data.custom_background);
    }
  }

  async function savePreferences(userId, prefs) {
    try {
      pushDiag("prefSync", "start", { userId, keys: Object.keys(prefs || {}) });

      const { error } = await withLockRetry(() =>
        withTimeout(
          supabase.from(PREFERENCES_TABLE).upsert(
            {
              user_id: userId,
              ...prefs,
            },
            { onConflict: "user_id" },
          ),
          OP_TIMEOUT_MS,
        ),
      );

      if (error) {
        pushDiag("prefSync", "error", { userId, status: error.status, message: error.message || "" }, "warn");
        return false;
      }

      pushDiag("prefSync", "success", { userId });
      return true;
    } catch (error) {
      const isTimeout = String(error?.message || "") === "TIMEOUT";
      pushDiag(
        "prefSync",
        isTimeout ? "timeout" : "exception",
        { userId, error: String(error?.message || error) },
        "warn",
      );
      return false;
    }
  }

  async function loadOrCreateUsername(currentUser) {
    const { data } = await supabase
      .from(PROFILE_TABLE)
      .select("username")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (data?.username) {
      setCachedUsernameByUserId(currentUser.id, data.username);
      return data.username;
    }

    // If there is no profile row yet (common with confirm-email flow),
    // do NOT force-write "user" into profiles.
    // Only create profile when we have a valid candidate username.
    const metaName = normalizeUsername(currentUser.user_metadata?.username || "");
    if (isValidUsername(metaName)) {
      await ensureProfile(currentUser.id, metaName);
      setCachedUsernameByUserId(currentUser.id, metaName);
      return metaName;
    }

    const pendingName = normalizeUsername(getPendingUsernameByEmail(currentUser.email || ""));
    if (isValidUsername(pendingName)) {
      await ensureProfile(currentUser.id, pendingName);
      clearPendingUsernameByEmail(currentUser.email || "");
      setCachedUsernameByUserId(currentUser.id, pendingName);
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
      ddlDate: "",
      ddlTime: "",
      label: "",
      priority: "",
      repeat_rule: "none",
      repeat_until_date: "",
      remark: "",
    });
  }

  function openAddTaskModal() {
    setEditingTodoId(null);
    resetDraft();
    setIsAddModalOpen(true);
  }

  function openEditTodo(todo) {
    const dueParts = toDateAndTimeLocalParts(todo.ddl);
    setEditingTodoId(todo.id);
    setDraft({
      title: todo.title || "",
      estimated_hours: Number(todo.estimated_hours) > 0 ? String(todo.estimated_hours) : "",
      ddlDate: dueParts.date,
      ddlTime: dueParts.time,
      label: todo.label || "",
      priority: Number(todo.priority) > 0 ? String(todo.priority) : "",
      repeat_rule: normalizeRepeatRule(todo.repeat_rule),
      repeat_until_date: normalizeRepeatUntilDate(todo.repeat_until_date),
      remark: todo.remark || "",
    });
    setIsAddModalOpen(true);
  }

  function closeAddModal() {
    setIsAddModalOpen(false);
    setEditingTodoId(null);
    setDuplicateConfirmOpen(false);
    setPendingDuplicatePayload(null);
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

  function isDuplicateTodo(title, ddl) {
    const normalizedTitle = String(title || "").trim();
    const normalizedDdl = ddl || null;
    return todos.some((todo) => {
      const todoTitle = String(todo?.title || "").trim();
      const todoDdl = todo?.ddl || null;
      return todoTitle === normalizedTitle && todoDdl === normalizedDdl;
    });
  }

  async function handleTaskFormSubmit(event, options = {}) {
    const { skipDuplicateCheck = false, draftOverride = null } = options;
    event.preventDefault();
    const startedAt = Date.now();
    pushDiag("taskSubmit", "submit_enter", {
      isEditing: Boolean(editingTodoId),
      hasUser: Boolean(user),
      hasSupabase: Boolean(supabase),
      titleLen: String(draft.title || "").trim().length,
    });

    if (isSubmittingTask) {
      pushDiag("taskSubmit", "blocked_double_submit", {}, "warn");
      return;
    }

    setIsSubmittingTask(true);
    const watchdog = window.setTimeout(() => {
      pushDiag(
        "taskSubmit",
        "watchdog_timeout",
        {
          elapsedMs: Date.now() - startedAt,
          isEditing: Boolean(editingTodoId),
          hasUser: Boolean(user),
          hasSupabase: Boolean(supabase),
        },
        "error",
      );
      notify("提交超过12秒未完成，可能是超时或请求链中断。", true);
    }, SUBMIT_WATCHDOG_MS);

    try {
      const sourceDraft = draftOverride || draft;
      const title = String(sourceDraft.title || "").trim();
      if (!title) {
        pushDiag("taskSubmit", "validation_empty_title", {});
        notify(t.emptyTitle, true);
        return;
      }

      const estRaw = String(sourceDraft.estimated_hours ?? "").trim();
      const estimated_hours = estRaw === "" ? 0 : Math.max(0, Number(estRaw));
      const ddl = buildDueIso(sourceDraft.ddlDate, sourceDraft.ddlTime);
      const priRaw = String(sourceDraft.priority ?? "").trim();
      const priority = priRaw === "" ? 0 : Math.max(0, Math.min(10, Number(priRaw)));
      const repeat_rule = normalizeRepeatRule(sourceDraft.repeat_rule);
      const repeat_until_date = repeat_rule === "none" ? "" : normalizeRepeatUntilDate(sourceDraft.repeat_until_date);
      const label = String(sourceDraft.label ?? "").trim() || null;

      if (repeat_rule !== "none") {
        if (!repeat_until_date) {
          notify(t.repeatUntilRequired, true);
          return;
        }
        const startDateKey = normalizeRepeatUntilDate(sourceDraft.ddlDate) || toDateKeyFromIso(new Date().toISOString());
        const startDate = new Date(`${startDateKey}T00:00:00`);
        const endDate = new Date(`${repeat_until_date}T00:00:00`);
        const dayDiff = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000);
        if (dayDiff < 0) {
          notify(t.repeatUntilBeforeStart, true);
          return;
        }
        if (dayDiff > 365) {
          notify(t.repeatUntilMaxDaysError, true);
          return;
        }
      }

      const remark = composeRemarkAndRepeat(sourceDraft.remark, repeat_rule, repeat_until_date) || null;

      if (!editingTodoId && !skipDuplicateCheck && isDuplicateTodo(title, ddl)) {
        setPendingDuplicatePayload(sourceDraft);
        setDuplicateConfirmOpen(true);
        return;
      }

      if (editingTodoId) {
        pushDiag("taskSubmit", "edit_start", { todoId: editingTodoId });
        const patch = { title, estimated_hours, ddl, remark, repeat_rule, repeat_until_date, priority, label };
        await updateTodo(editingTodoId, patch);
        pushDiag("taskSubmit", "edit_success", { todoId: editingTodoId });
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
        local_dirty: true,
        local_updated_at: new Date().toISOString(),
      };

      // Local-first mode: add task immediately to local store.
      pushDiag("taskSubmit", "local_insert", { taskId: payload.id });
      payload.user_id = user?.id || null;
      const next = [mapTodo(payload), ...todos];
      setTodos(next);
      syncLocal(next);
      closeAddModal();
      notify(t.addSuccess, false);
    } catch (err) {
      pushDiag("taskSubmit", "submit_exception", { error: String(err?.message || err) }, "error");
      notify(`操作失败: ${err.message}`, true);
    } finally {
      window.clearTimeout(watchdog);
      setIsSubmittingTask(false);
      pushDiag("taskSubmit", "submit_exit", { elapsedMs: Date.now() - startedAt });
    }
  }

  function handleDuplicateConfirm() {
    const queuedDraft = pendingDuplicatePayload;
    setDuplicateConfirmOpen(false);
    setPendingDuplicatePayload(null);
    if (!queuedDraft) return;
    const fakeEvent = { preventDefault() {} };
    void handleTaskFormSubmit(fakeEvent, { skipDuplicateCheck: true, draftOverride: queuedDraft });
  }

  function handleTaskSubmitProbe(stage) {
    pushDiag("taskSubmit", stage, {
      isEditing: Boolean(editingTodoId),
      hasUser: Boolean(user),
      hasSupabase: Boolean(supabase),
    });
  }

  async function updateTodo(id, patch) {
    const previous = todos;
    const targetBefore = previous.find((item) => item.id === id);
    if (!targetBefore) return;

    const nextPatch = { ...patch };
    if (nextPatch.progress_percent != null) {
      nextPatch.progress_percent = snapProgress(nextPatch.progress_percent);
    }

    const hasRepeatPatch = Object.prototype.hasOwnProperty.call(nextPatch, "repeat_rule");
    const hasRepeatUntilPatch = Object.prototype.hasOwnProperty.call(nextPatch, "repeat_until_date");
    const hasRemarkPatch = Object.prototype.hasOwnProperty.call(nextPatch, "remark");
    const effectiveRepeat = normalizeRepeatRule(hasRepeatPatch ? nextPatch.repeat_rule : targetBefore.repeat_rule);
    const effectiveRepeatUntil = normalizeRepeatUntilDate(
      hasRepeatUntilPatch ? nextPatch.repeat_until_date : targetBefore.repeat_until_date,
    );

    if (hasRepeatPatch || hasRepeatUntilPatch || hasRemarkPatch) {
      const rawRemark = hasRemarkPatch ? nextPatch.remark : targetBefore.remark;
      nextPatch.remark = composeRemarkAndRepeat(rawRemark, effectiveRepeat, effectiveRepeatUntil) || null;
      nextPatch.repeat_rule = effectiveRepeat;
      nextPatch.repeat_until_date = effectiveRepeatUntil;
    }

    const uiPatch = { ...nextPatch };
    if (hasRepeatPatch || hasRepeatUntilPatch || hasRemarkPatch) {
      const parsed = parseRemarkAndRepeat(uiPatch.remark ?? targetBefore.remark);
      uiPatch.remark = parsed.remark;
      uiPatch.repeat_rule = normalizeRepeatRule(uiPatch.repeat_rule ?? parsed.repeat_rule);
      uiPatch.repeat_until_date = normalizeRepeatUntilDate(uiPatch.repeat_until_date ?? parsed.repeat_until_date);
    }

    const localUpdateTs = new Date().toISOString();
    const next = previous.map((item) =>
      item.id === id
        ? { ...item, ...uiPatch, local_dirty: true, local_updated_at: localUpdateTs }
        : item,
    );
    setTodos(next);

    syncLocal(next);

    const nextStatus = Object.prototype.hasOwnProperty.call(uiPatch, "status") ? uiPatch.status : targetBefore.status;
    const repeatRule = normalizeRepeatRule(uiPatch.repeat_rule ?? targetBefore.repeat_rule);
    const shouldGenerateRecurring =
      targetBefore.status !== STATUS_DONE &&
      nextStatus === STATUS_DONE &&
      repeatRule !== "none";

    if (shouldGenerateRecurring) {
      const baseTodo = { ...targetBefore, ...uiPatch, repeat_rule: repeatRule };
      const repeatUntilDate = normalizeRepeatUntilDate(baseTodo.repeat_until_date);
      const nextRecurringDdl = getNextRecurringDdl(baseTodo.ddl, repeatRule);
      if (repeatUntilDate && nextRecurringDdl) {
        const nextDateKey = toDateKeyFromIso(nextRecurringDdl);
        if (nextDateKey && nextDateKey > repeatUntilDate) {
          return;
        }
      }
      const nextRecurringPayload = {
        id: crypto.randomUUID(),
        title: baseTodo.title,
        status: STATUS_PENDING,
        estimated_hours: Number(baseTodo.estimated_hours || 0),
        ddl: nextRecurringDdl,
        remark: composeRemarkAndRepeat(baseTodo.remark, repeatRule, repeatUntilDate) || null,
        priority: Number(baseTodo.priority || 0),
        label: baseTodo.label || null,
        progress_percent: 0,
        created_at: new Date().toISOString(),
        user_id: user?.id || null,
        local_dirty: true,
        local_updated_at: new Date().toISOString(),
      };

      const localRecurring = mapTodo(nextRecurringPayload);
      setTodos((prev) => {
        const merged = [localRecurring, ...prev];
        syncLocal(merged);
        return merged;
      });
    }
  }

  async function handleDelete(id) {
    const next = todos.map((item) =>
      item.id === id
        ? {
            ...item,
            status: STATUS_DELETED,
            deleted_at: new Date().toISOString(),
            local_dirty: true,
            local_updated_at: new Date().toISOString(),
          }
        : item,
    );
    setTodos(next);

    syncLocal(next);
  }

  async function confirmDeleteEditingTask() {
    const id = editingTodoId;
    if (!id) return;
    await handleDelete(id);
    setConfirmDeleteOpen(false);
    closeAddModal();
  }

  async function handleLogin(event) {
    event.preventDefault();
    if (isLoggingIn) return;

    if (!supabase) {
      notify(t.supabaseMissing, true);
      return;
    }

    const email = String(loginEmail || "").trim().toLowerCase();
    if (!isValidEmail(email) || loginPassword.length < 6) {
      notify(t.invalidLogin, true);
      return;
    }

    setIsLoggingIn(true);
    let error;
    try {
      const result = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password: loginPassword,
        }),
        OP_TIMEOUT_MS,
      );
      error = result.error;
    } catch (timeoutError) {
      if (String(timeoutError?.message || "") === "TIMEOUT") {
        notify(t.requestTimeout, true);
        return;
      }
      notify(`${t.loginFailed}: ${String(timeoutError?.message || timeoutError)}`, true);
      return;
    } finally {
      setIsLoggingIn(false);
    }

    if (error) {
      notify(`${t.loginFailed}: ${error.message}`, true);
      return;
    }

    isLogoutInProgressRef.current = false;
    ignoreAuthEventsUntilRef.current = 0;

    setIsAuthModalOpen(false);
    setLoginEmail("");
    setLoginPassword("");
    notify(t.loginSuccess, false);
  }

  async function handleRegister(event) {
    event.preventDefault();
    if (isRegistering) return;

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

    setIsRegistering(true);

    let data;
    let error;
    try {
      if (await isUsernameTaken(uname)) {
        notify(t.usernameTaken, true);
        return;
      }

      const result = await withTimeout(
        supabase.auth.signUp({
          email,
          password: registerPassword,
          options: {
            data: {
              username: uname,
            },
          },
        }),
        OP_TIMEOUT_MS,
      );
      data = result.data;
      error = result.error;
    } catch (timeoutError) {
      if (String(timeoutError?.message || "") === "TIMEOUT") {
        notify(t.requestTimeout, true);
        return;
      }
      notify(`${t.registerFailed}: ${String(timeoutError?.message || timeoutError)}`, true);
      return;
    } finally {
      setIsRegistering(false);
    }

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

    isLogoutInProgressRef.current = false;
    ignoreAuthEventsUntilRef.current = 0;

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
    if (isVerifyingOtp) return;

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

    setIsVerifyingOtp(true);

    let data;
    let error;
    try {
      const result = await withTimeout(
        supabase.auth.verifyOtp({
          email,
          token,
          type: "signup",
        }),
        OP_TIMEOUT_MS,
      );
      data = result.data;
      error = result.error;
    } catch (timeoutError) {
      if (String(timeoutError?.message || "") === "TIMEOUT") {
        notify(t.requestTimeout, true);
        return;
      }
      notify(`${t.otpFailed}: ${String(timeoutError?.message || timeoutError)}`, true);
      return;
    } finally {
      setIsVerifyingOtp(false);
    }

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

    isLogoutInProgressRef.current = false;
    ignoreAuthEventsUntilRef.current = 0;

    setIsOtpModalOpen(false);
    setOtpEmail("");
    setOtpCode("");
    notify(t.registerVerified, false);
  }

  function handleStartTimer(taskId) {
    setTimerTaskId(taskId);
  }

  function handleStopTimer() {
    // Stop only resets timer state in the widget; does not close it.
  }

  function handleCloseTimer() {
    setTimerTaskId(null);
  }

  async function handleLogout() {
    pushDiag("auth", "logout_click", { hasSupabase: Boolean(supabase), hasUser: Boolean(user) });

    isLogoutInProgressRef.current = true;
    ignoreAuthEventsUntilRef.current = Date.now() + 15000;
    authSyncSeqRef.current += 1;

    try {
      if (supabase) {
        await withTimeout(supabase.auth.signOut(), 6000);
        pushDiag("auth", "logout_remote_success", {});
      }
    } catch (error) {
      const isTimeout = String(error?.message || "") === "TIMEOUT";
      pushDiag("auth", isTimeout ? "logout_remote_timeout" : "logout_remote_error", { error: String(error?.message || error) }, "warn");
    }
    // Always clear local state
    setUser(null);
    setUsername("");
    setTodos(readLocalTodos(GUEST_KEY));
    setIsAuthModalOpen(false);
    previousUserIdRef.current = null;
    autoSyncInFlightRef.current = false;
    migrationPromptShownForUserRef.current = null;
    setIsMigratePromptOpen(false);
    notify('已退出登录', false);
    pushDiag("auth", "logout_local_cleared", {});
    return true;
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

        const resolved = inserted?.username || uname;
        setUsername(resolved);
        setCachedUsernameByUserId(user.id, resolved);
      } else {
        const resolved = updated.username || uname;
        setUsername(resolved);
        setCachedUsernameByUserId(user.id, resolved);
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

  async function performCloudSync(source = "manual") {
    if (!supabase || !user) {
      if (source === "manual") notify(t.actionNeedLogin, true);
      return false;
    }

    const guard = tryAcquireSyncGuard(source);
    if (!guard.ok) {
      const seconds = (guard.elapsedMs / 1000).toFixed(1);
      if (source === "manual") {
        notify(`${t.syncBusyPrefix}: ${guard.holder} (${seconds}s)`, true);
      }
      pushDiag("sync", "blocked_by_guard", { source, holder: guard.holder, elapsedMs: guard.elapsedMs }, "warn");
      return false;
    }

    if (autoSyncInFlightRef.current) {
      pushDiag("sync", "skip_in_flight", { source }, "warn");
      releaseSyncGuard(guard.token);
      return false;
    }

    autoSyncInFlightRef.current = true;
    setIsSyncing(true);
    try {
      const localTodos = mergeTodoLists(readLocalTodos(`taskease_todos_${user.id}`), readLocalTodos(GUEST_KEY), todos);
      const lastSyncAt = getLastSyncAt(user.id);
      const dirtyTodos = localTodos.filter((x) => isTodoLocallyDirtyOrNew(x, lastSyncAt));

      const deletedIds = dirtyTodos
        .filter((x) => x.status === STATUS_DELETED)
        .map((x) => String(x.id || "").trim())
        .filter(Boolean);
      const syncableTodos = dirtyTodos.filter((x) => x.status !== STATUS_DELETED);

      if (deletedIds.length > 0) {
        const deleteResult = await withLockRetry(
          () => withTimeout(
            supabase.from(TODO_TABLE).delete().eq("user_id", user.id).in("id", deletedIds),
            OP_TIMEOUT_MS,
          ),
        );
        if (deleteResult?.error) {
          throw new Error(deleteResult.error.message || "Failed to delete tombstones from cloud");
        }
      }

      if (syncableTodos.length > 0) {
        const rows = syncableTodos.map((x) => ({
          id: x.id || crypto.randomUUID(),
          title: String(x.title || "").trim() || "Untitled",
          status: x.status === STATUS_DONE ? STATUS_DONE : STATUS_PENDING,
          estimated_hours: Number(x.estimated_hours ?? 0),
          ddl: x.ddl || null,
          remark: composeRemarkAndRepeat(x.remark, x.repeat_rule, x.repeat_until_date) || null,
          priority: Number(x.priority ?? 0),
          label: x.label || null,
          progress_percent: snapProgress(x.progress_percent ?? 0),
          created_at: x.created_at || new Date().toISOString(),
          user_id: user.id,
        }));

        const upsertResult = await withLockRetry(
          () => withTimeout(
            supabase.from(TODO_TABLE).upsert(rows, { onConflict: "id" }),
            OP_TIMEOUT_MS,
          ),
        );
        if (upsertResult?.error) {
          throw new Error(upsertResult.error.message || "Failed to upsert local changes to cloud");
        }
      }

      const cloudTodos = await withLockRetry(() => withTimeout(loadTodosForUser(user.id, { includeLocal: false }), OP_TIMEOUT_MS));
      const localUnsynced = localTodos.filter((x) => {
        const id = String(x.id || "").trim();
        if (!id) return false;
        return isTodoLocallyDirtyOrNew(x, lastSyncAt) && x.status !== STATUS_DELETED;
      });
      const mergedTodos = mergeTodoLists(cloudTodos, localUnsynced).map((todo) => {
        if (!todo || typeof todo !== "object") return todo;
        const cleaned = { ...todo };
        delete cleaned.local_dirty;
        delete cleaned.local_updated_at;
        delete cleaned.deleted_at;
        return cleaned;
      });
      setTodos(mergedTodos);
      writeLocalTodos(storageKey, mergedTodos);
      setLastSyncAt(user.id, new Date().toISOString());

      await savePreferences(user.id, {
        language: lang,
        clock_format: clockFormat,
        theme_mode: themeMode,
        task_labels: taskLabels,
        auto_sync_enabled: autoSyncEnabled,
      });

      pushDiag("sync", "success", { source, count: mergedTodos.length });
      if (source === "manual") notify(t.syncSuccess, false);
      return true;
    } catch (error) {
      const isTimeout = String(error?.message || "") === "TIMEOUT";
      pushDiag("sync", isTimeout ? "timeout" : "error", { source, error: String(error?.message || error) }, "error");
      if (source === "manual") {
        notify(isTimeout ? t.requestTimeout : `${t.syncFailed}: ${String(error?.message || error)}`, true);
      }
      return false;
    } finally {
      autoSyncInFlightRef.current = false;
      setIsSyncing(false);
      releaseSyncGuard(guard.token);
    }
  }

  async function handleManualSync() {
    return await performCloudSync("manual");
  }

  async function handleToggleAutoSync(nextEnabled) {
    setAutoSyncEnabled(nextEnabled);
    if (!supabase || !user) {
      notify(nextEnabled ? t.autoSyncEnabledNotice : t.autoSyncDisabledNotice, false);
      return;
    }

    await savePreferences(user.id, {
      language: lang,
      clock_format: clockFormat,
      theme_mode: themeMode,
      task_labels: taskLabels,
      auto_sync_enabled: nextEnabled,
    });
    notify(nextEnabled ? t.autoSyncEnabledNotice : t.autoSyncDisabledNotice, false);
  }

  async function migrateLocalDataToCurrentUser() {
    if (!supabase || !user) return false;
    const guestTodos = readLocalTodos(GUEST_KEY);

    setIsMigratingLocalData(true);
    try {
      if (guestTodos.length > 0) {
        const rows = guestTodos.map((x) => ({
          id: x.id || crypto.randomUUID(),
          title: String(x.title || "").trim() || "Untitled",
          status: x.status === STATUS_DONE ? STATUS_DONE : STATUS_PENDING,
          estimated_hours: Number(x.estimated_hours ?? 0),
          ddl: x.ddl || null,
          remark: composeRemarkAndRepeat(x.remark, x.repeat_rule) || null,
          priority: Number(x.priority ?? 0),
          label: x.label || null,
          progress_percent: snapProgress(x.progress_percent ?? 0),
          created_at: x.created_at || new Date().toISOString(),
          user_id: user.id,
        }));

        const { error } = await withTimeout(
          supabase.from(TODO_TABLE).upsert(rows, { onConflict: "id" }),
          OP_TIMEOUT_MS,
        );
        if (error) throw error;
      }

      await savePreferences(user.id, {
        language: lang,
        clock_format: clockFormat,
        theme_mode: themeMode,
        task_labels: taskLabels,
        auto_sync_enabled: autoSyncEnabled,
        theme_preset: themePreset,
        custom_background: customBackground,
      });

      localStorage.removeItem(GUEST_KEY);
      localStorage.removeItem(GUEST_LABELS_KEY);

      await performCloudSync("manual");
      setIsMigratePromptOpen(false);
      notify(t.migrateLocalSuccess, false);
      pushDiag("migration", "success", { userId: user.id, migratedCount: guestTodos.length });
      return true;
    } catch (error) {
      pushDiag("migration", "error", { userId: user.id, error: String(error?.message || error) }, "error");
      notify(`${t.migrateLocalFailed}: ${String(error?.message || error)}`, true);
      return false;
    } finally {
      setIsMigratingLocalData(false);
    }
  }

  const customBackgroundStyle = customBackground
    ? {
        backgroundImage: `url(${customBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }
    : {
        background: "linear-gradient(135deg, #5f7f9f 0%, #7f5f8f 100%)",
      };

  return (
    <main
      className="container-fluid py-3"
      style={{
        minHeight: "100vh",
        "--te-soft-btn": themeColors.softBtn,
        "--te-soft-btn-border": themeColors.softBtnBorder,
        "--te-range-track": themeColors.activeBtn,
        ...(isCustomBgTheme ? customBackgroundStyle : { backgroundColor: pageBg }),
      }}
    >
      <div
        className="mx-auto"
        style={{
          maxWidth: "1120px",
          backgroundColor: isCustomBgTheme ? "rgba(0, 0, 0, 0.28)" : "transparent",
          backdropFilter: isCustomBgTheme ? "blur(6px)" : "none",
          border: isCustomBgTheme ? "1px solid rgba(255, 255, 255, 0.35)" : "none",
          borderRadius: isCustomBgTheme ? "16px" : "0",
          padding: isCustomBgTheme ? "14px" : "0",
        }}
      >
        <Toast notice={notice} onClose={() => setNotice({ text: "", warning: false })} />

        <Header
            t={t}
            user={user}
            username={username}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
            themePreset={themePreset}
            setThemePreset={setThemePreset}
            customBackground={customBackground}
            setCustomBackground={setCustomBackground}
            themeColors={themeColors}
            isCustomBgTheme={isCustomBgTheme}
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
            onOpenAbout={() => setIsAboutModalOpen(true)}
            onManualSync={handleManualSync}
            isSyncing={isSyncing}
            autoSyncEnabled={autoSyncEnabled}
            onToggleAutoSync={handleToggleAutoSync}
            logoColor={logoColor}
            pageBg={pageBg}
            resolvedTheme={resolvedTheme}
          />

        <TaskManager
          t={t}
          lang={lang}
          clock={clock}
          pendingTodos={pendingTodos}
          estimateHours={estimateHours}
          filter={filter}
          setFilter={setFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
          visibleTodos={visibleTodos}
          onAddTask={openAddTaskModal}
          onOpenPlanWork={() => setIsPlanWorkModalOpen(true)}
          panelBg={panelBg}
          listBg={listBg}
          themeColors={themeColors}
          STATUS_DONE={STATUS_DONE}
          STATUS_PENDING={STATUS_PENDING}
          updateTodo={updateTodo}
          onEditTodo={openEditTodo}
          snapProgress={snapProgress}
          onStartTimer={handleStartTimer}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          t={t}
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
          isLoggingIn={isLoggingIn}
          isRegistering={isRegistering}
          pageBg={pageBg}
          themeColors={themeColors}
        />

        <AddTaskModal
          isOpen={isAddModalOpen}
          onClose={closeAddModal}
          t={t}
          draft={draft}
          setDraft={setDraft}
          onSubmit={handleTaskFormSubmit}
          onSubmitProbe={handleTaskSubmitProbe}
          isSubmitting={isSubmittingTask}
          pageBg={pageBg}
          themeColors={themeColors}
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

        <ConfirmModal
          isOpen={duplicateConfirmOpen}
          onClose={() => {
            setDuplicateConfirmOpen(false);
            setPendingDuplicatePayload(null);
          }}
          title={t.duplicateTaskTitle}
          message={t.duplicateTaskMessage}
          confirmLabel={t.duplicateTaskConfirm}
          cancelLabel={t.cancel}
          closeAriaLabel={t.close}
          pageBg={pageBg}
          onConfirm={handleDuplicateConfirm}
        />

        <ConfirmModal
          isOpen={isMigratePromptOpen}
          onClose={() => {
            if (!isMigratingLocalData) setIsMigratePromptOpen(false);
          }}
          title={t.migrateLocalTitle}
          message={t.migrateLocalMessage}
          confirmLabel={
            isMigratingLocalData ? (
              <>
                {t.migrateLocalConfirm}
                <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" />
              </>
            ) : (
              t.migrateLocalConfirm
            )
          }
          cancelLabel={t.cancel}
          closeAriaLabel={t.close}
          pageBg={pageBg}
          onConfirm={() => {
            if (!isMigratingLocalData) {
              void migrateLocalDataToCurrentUser();
            }
          }}
        />

        <PlanWorkModal
          isOpen={isPlanWorkModalOpen}
          onClose={() => setIsPlanWorkModalOpen(false)}
          t={t}
          todos={todos}
          STATUS_DONE={STATUS_DONE}
          pageBg={pageBg}
          themeColors={themeColors}
        />

        <ProfileSettingsModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          t={t}
          pageBg={pageBg}
          themeColors={themeColors}
          username={username}
          email={user?.email || ""}
          onUpdateEmail={handleUpdateEmail}
          onUpdateUsername={handleUpdateUsername}
          onResetPassword={handleResetPassword}
        />

        <AboutModal
          isOpen={isAboutModalOpen}
          onClose={() => setIsAboutModalOpen(false)}
          t={t}
          pageBg={pageBg}
          repoUrl={PROJECT_REPO_URL}
        />

        <OtpModal
          isOpen={isOtpModalOpen}
          onClose={() => setIsOtpModalOpen(false)}
          t={t}
          otpEmail={otpEmail}
          otpCode={otpCode}
          setOtpCode={setOtpCode}
          onOtpVerify={handleOtpVerify}
          isVerifyingOtp={isVerifyingOtp}
          pageBg={pageBg}
          themeColors={themeColors}
        />

        <PomodoroTimer
          isActive={timerTaskId !== null}
          taskData={currentTimerTask}
          onStop={handleStopTimer}
          onClose={handleCloseTimer}
        />
      </div>
    </main>
  );
}
