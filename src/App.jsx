import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { countOccurrencesByRule, getNextRecurringIso, normalizeDateKey } from "./utils/recurrence";
import { applyPomodoroStopProgress } from "./utils/pomodoroProgress";
import { dedupePomodoroSessionList } from "./utils/pomodoroSessions";
import { getAppLocale, toLocalDateKey } from "./utils/locale";
import { Header } from "./components/Header";
import { TaskManager } from "./components/TaskManager";
import { AddTaskModal } from "./components/AddTaskModal";
import { PlanWorkModal } from "./components/PlanWorkModal";
import { Toast } from "./components/Toast";
import { ConfirmModal } from "./components/ConfirmModal";
import { PomodoroTimer } from "./components/PomodoroTimer";
import { AboutModal } from "./components/AboutModal";
import { DataStatsModal } from "./components/DataStatsModal";
import { TaskLabelsModal } from "./components/TaskLabelsModal";
import { ModalShell } from "./components/ModalShell";
import { DataBackupModal } from "./components/DataBackupModal";
import { DateInput } from "./components/DateInput";
import { storage } from "./storage";

function PomodoroManagementModal({
  isOpen,
  onClose,
  t,
  locale,
  pageBg,
  themeColors,
  resolvedTheme,
  _records,
  maxSeconds,
  onSave,
  onDelete,
  isSaving,
  sessions,
  taskTitleById,
  isLoadingSession,
}) {
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingHours, setEditingHours] = useState("0");
  const [editingMinutes, setEditingMinutes] = useState("0");
  const [editingSeconds, setEditingSeconds] = useState("0");
  
  // Get today's date in YYYY-MM-DD format for the input
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];
  const [selectedDateInput, setSelectedDateInput] = useState(todayString);
  
  const textColor = resolvedTheme === "dark" ? "#f8f9fa" : "#2b2b2b";

  useEffect(() => {
    if (isOpen) {
      // Reset selected date to today when modal opens
      const today = new Date();
      const todayString = today.toISOString().split("T")[0];
      setSelectedDateInput(todayString);
    } else {
      setEditingSessionId(null);
      setEditingHours("0");
      setEditingMinutes("0");
      setEditingSeconds("0");
    }
  }, [isOpen]);

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    // 选中日期本身就是 YYYY-MM-DD，直接用；不要再交给 Date 解析
    // （new Date("YYYY-MM-DD") 按 UTC 解析，再用本地方法取日期会在负时区跨天）
    const selectedDateKey = String(selectedDateInput || "").trim();

    const groups = {};
    sessions.forEach((session) => {
      const dateKey = toLocalDateKey(session.start_time || "");
      if (!dateKey) return;

      // Only include sessions from the selected date
      if (dateKey !== selectedDateKey) return;

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(session);
    });
    
    // Sort sessions within each group (newest first)
    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((dateKey) => ({
        dateKey,
        sessions: groups[dateKey].sort(
          (a, b) => new Date(b.start_time) - new Date(a.start_time)
        ),
      }));
  }, [sessions, selectedDateInput]);

  function formatDuration(totalSeconds) {
    const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds || 0)));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;
    if (t.hourUnit === "hours") {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${hours}${t.durationHourUnit}${minutes}${t.durationMinuteUnit}${seconds}${t.durationSecondUnit}`;
  }

  function formatTimeOnly(isoString) {
    const d = new Date(isoString);
    if (!Number.isFinite(d.getTime())) return "-";
    // 必须显式传 locale：不传会跟随系统语言，英文界面下会显示中文格式
    return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }

  function startEditing(session) {
    const totalSeconds = Math.max(0, Number(session.duration_seconds || 0));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    setEditingSessionId(session.id);
    setEditingHours(String(hours));
    setEditingMinutes(String(minutes));
    setEditingSeconds(String(seconds));
  }

  async function submitEdit(sessionId) {
    const hourValue = Number(editingHours);
    const minuteValue = Number(editingMinutes);
    const secondValue = Number(editingSeconds);
    if (!Number.isFinite(hourValue) || !Number.isFinite(minuteValue) || !Number.isFinite(secondValue)) return;
    const totalSeconds = hourValue * 3600 + minuteValue * 60 + secondValue;
    const safeTotalSeconds = Math.max(0, Math.min(totalSeconds, maxSeconds));
    const ok = await onSave(sessionId, safeTotalSeconds);
    if (ok) {
      setEditingSessionId(null);
      setEditingHours("0");
      setEditingMinutes("0");
      setEditingSeconds("0");
    }
  }

  return (
    <ModalShell isOpen={isOpen} onClose={onClose}>
      {(requestClose) => (
        <div className="modal-dialog" style={{ marginTop: "60px", maxWidth: "1000px" }}>
          <div className="modal-content" style={{ backgroundColor: pageBg, fontFamily: "inherit" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title fs-6">{t.pomodoroManageTitle}</h2>
              <button type="button" className="btn-close" aria-label={t.close} onClick={requestClose} />
            </div>
            <div className="modal-body d-grid gap-3">
              <div className="small" style={{ color: textColor, opacity: 0.78 }}>{t.pomodoroManageHint}</div>
              
              {/* Date filter section */}
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <label style={{ color: textColor, fontSize: "0.9rem", margin: 0, whiteSpace: "nowrap" }}>
                  {t.pomodoroDateLabel}:
                </label>
                <DateInput
                  value={selectedDateInput}
                  hint={t.datePlaceholder}
                  onChange={(e) => setSelectedDateInput(e.target.value)}
                  style={{
                    backgroundColor: themeColors.listBg,
                    borderColor: themeColors.softBtnBorder,
                    color: textColor,
                    fontSize: "0.9rem",
                    flex: "1",
                    maxWidth: "200px",
                  }}
                />
              </div>

              {isLoadingSession ? (
                <div className="text-center">
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="small" style={{ color: textColor, opacity: 0.78 }}>{t.pomodoroManageEmpty}</div>
              ) : groupedSessions.length === 0 ? (
                <div className="small" style={{ color: textColor, opacity: 0.78 }}>{t.pomodoroNoRecordsForDate}</div>
              ) : (
                <div className="d-grid gap-3">
                  {groupedSessions.map((group, groupIdx) => (
                    <div key={`group-${group.dateKey}`}>
                      {/* Date header */}
                      <div className="small" style={{ color: textColor, opacity: 0.6, marginBottom: "0.5rem" }}>
                        {group.dateKey}
                      </div>
                      
                      {/* Sessions table-like rows (no borders) */}
                      <div>
                        {group.sessions.map((session, sessionIdx) => {
                          const isEditing = editingSessionId === session.id;
                          const resolvedTitle = String(taskTitleById?.[String(session.task_id || "")] || "").trim() || String(session.task_title || "").trim() || "Untitled";
                          const rowNum = groupedSessions
                            .slice(0, groupIdx)
                            .reduce((acc, g) => acc + g.sessions.length, 0) + sessionIdx + 1;
                          return (
                            <div
                              key={`session-${session.id}`}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "40px 1fr 100px minmax(260px, 1fr) 1fr",
                                gap: "1rem",
                                alignItems: "center",
                                paddingBottom: "1rem",
                                marginBottom: "1rem",
                                borderBottom: `1px solid ${themeColors.softBtnBorder}`,
                              }}
                            >
                              {/* Index */}
                              <div style={{ color: textColor, opacity: 0.7, fontSize: "0.9rem" }}>
                                {rowNum}
                              </div>

                              {/* Task name */}
                              <div style={{ color: textColor, fontSize: "0.95rem" }}>
                                {resolvedTitle}
                              </div>

                              {/* Start time */}
                              <div style={{ color: textColor, fontSize: "0.9rem", opacity: 0.8 }}>
                                {formatTimeOnly(session.start_time)}
                              </div>

                              {/* Duration */}
                              {isEditing ? (
                                <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", flexWrap: "nowrap", whiteSpace: "nowrap" }}>
                                  <input
                                    type="number"
                                    className="form-control"
                                    min={0}
                                    max={Math.floor(maxSeconds / 3600)}
                                    step={1}
                                    value={editingHours}
                                    onChange={(e) => setEditingHours(e.target.value)}
                                    style={{
                                      backgroundColor: themeColors.listBg,
                                      borderColor: themeColors.softBtnBorder,
                                      color: textColor,
                                      fontSize: "0.85rem",
                                      padding: "0.25rem 0.5rem",
                                      width: "45px",
                                    }}
                                  />
                                  <span style={{ fontSize: "0.85rem", color: textColor, flex: "0 0 auto" }}>{t.durationHourUnit}</span>
                                  <input
                                    type="number"
                                    className="form-control"
                                    min={0}
                                    max={59}
                                    step={1}
                                    value={editingMinutes}
                                    onChange={(e) => setEditingMinutes(e.target.value)}
                                    style={{
                                      backgroundColor: themeColors.listBg,
                                      borderColor: themeColors.softBtnBorder,
                                      color: textColor,
                                      fontSize: "0.85rem",
                                      padding: "0.25rem 0.5rem",
                                      width: "45px",
                                    }}
                                  />
                                  <span style={{ fontSize: "0.85rem", color: textColor, flex: "0 0 auto" }}>{t.durationMinuteUnit}</span>
                                  <input
                                    type="number"
                                    className="form-control"
                                    min={0}
                                    max={59}
                                    step={1}
                                    value={editingSeconds}
                                    onChange={(e) => setEditingSeconds(e.target.value)}
                                    style={{
                                      backgroundColor: themeColors.listBg,
                                      borderColor: themeColors.softBtnBorder,
                                      color: textColor,
                                      fontSize: "0.85rem",
                                      padding: "0.25rem 0.5rem",
                                      width: "45px",
                                    }}
                                  />
                                  <span style={{ fontSize: "0.85rem", color: textColor, flex: "0 0 auto" }}>{t.durationSecondUnit}</span>
                                </div>
                              ) : (
                                <div style={{ color: textColor, fontSize: "0.9rem", whiteSpace: "nowrap" }}>
                                  {formatDuration(session.duration_seconds)}
                                </div>
                              )}

                              {/* Edit/Delete buttons */}
                              <div className="d-flex gap-2" style={{ justifyContent: "flex-end" }}>
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-sm"
                                      disabled={isSaving}
                                      style={{
                                        backgroundColor: "#28a745",
                                        color: "#fff",
                                        border: "none",
                                        padding: "0.35rem 0.65rem",
                                        fontSize: "0.85rem",
                                      }}
                                      onClick={() => {
                                        void submitEdit(session.id);
                                      }}
                                    >
                                      {t.save}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm"
                                      disabled={isSaving}
                                      style={{
                                        backgroundColor: themeColors.softBtn,
                                        borderColor: themeColors.softBtnBorder,
                                        color: "#2b2b2b",
                                        border: `1px solid ${themeColors.softBtnBorder}`,
                                        padding: "0.35rem 0.65rem",
                                        fontSize: "0.85rem",
                                      }}
                                      onClick={() => {
                                        setEditingSessionId(null);
                                        setEditingMinutes("0");
                                      }}
                                    >
                                      {t.cancel}
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-sm"
                                      disabled={isSaving}
                                      style={{
                                        backgroundColor: themeColors.softBtn,
                                        borderColor: themeColors.softBtnBorder,
                                        color: "#2b2b2b",
                                        border: `1px solid ${themeColors.softBtnBorder}`,
                                        padding: "0.35rem 0.65rem",
                                        fontSize: "0.85rem",
                                      }}
                                      onClick={() => startEditing(session)}
                                    >
                                      {t.edit}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm"
                                      disabled={isSaving}
                                      style={{
                                        backgroundColor: "#d32f2f",
                                        color: "#fff",
                                        border: "none",
                                        padding: "0.35rem 0.65rem",
                                        fontSize: "0.85rem",
                                      }}
                                      onClick={() => {
                                        void onDelete(session.id);
                                      }}
                                    >
                                      {t.remove}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

const POMODORO_MAX_SECONDS = 5 * 3600;
const POMODORO_MIN_RECORD_SECONDS = 60;

const STATUS_PENDING = "pending";
const STATUS_DONE = "done";
const STATUS_DELETED = "deleted";
const LABEL_FILTER_UNLABELED = "__UNLABELED__";

// 界面偏好（主题 / 语言 / 时间制式）体量极小、丢了也能 30 秒重设，
// 因此仍放在 localStorage 以便同步读取；任务与番茄钟数据才走 src/storage。
const THEME_KEY = "taskease_theme_mode";
const LANG_KEY = "taskease_lang";
const CLOCK_KEY = "taskease_clock_format";
const PROJECT_REPO_URL = "https://github.com/baiweichihu/TaskEase";

// 主题精简为单一「米黄」配色，仅区分浅色 / 深色两种色调
function getThemeColors(tone) {
  const palette = {
    light: { pageBg: "#efe3cb", panelBg: "#f8eede", listBg: "#faefdf", logoColor: "#6b4f2f", softBtn: "#f2c84b", softBtnBorder: "#e9bd34", activeBtn: "#e0ae1c", activeBtnBorder: "#d39d0c" },
    dark: { pageBg: "#1e2636", panelBg: "#2a3447", listBg: "#334159", logoColor: "#f8e7c4", softBtn: "#f2c84b", softBtnBorder: "#e9bd34", activeBtn: "#d39d0c", activeBtnBorder: "#b8860b" },
  };

  return palette[tone === "dark" ? "dark" : "light"];
}

const TEXT = {
  "zh-CN": {
    settings: "设置",
    confirm: "确定",
    add: "添加",
    delete: "删除",
    themeLabel: "外观",
    themeLight: "浅色",
    themeDark: "深色",
    themeSystem: "跟随系统",
    loadingData: "正在加载数据…",
    dataLocation: "数据存储位置",
    dataBackup: "数据与备份",
    dataLocationDesktop: "SQLite 数据库（存放在 Windows AppData 数据目录中）",
    dataLocationWeb: "浏览器本地存储（localStorage）",
    datePlaceholder: "年/月/日",
    backupSection: "备份",
    backupHint: "备份文件是可读的 JSON，包含全部任务、番茄钟记录与标签。",
    backupRestoreHint: "备份文件可以保存到任意位置；需要恢复时用「导入备份」选择它即可。",
    exportBackup: "导出备份",
    exportBackupSuccess: "备份已导出。",
    exportBackupFailed: "导出备份失败。",
    importBackup: "导入备份",
    importBackupConfirmTitle: "确认导入备份？",
    importBackupConfirmMessage: "导入会覆盖当前全部任务、番茄钟记录与标签，且无法撤销。建议先导出一份当前数据。",
    importBackupConfirm: "确认导入",
    importBackupSuccess: "导入完成：",
    importBackupFailed: "导入备份失败。",
    unitTasks: "个任务",
    unitSessions: "条番茄钟记录",
    language: "语言",
    clockFormat: "时间制式",
    close: "关闭",
    addTask: "添加任务",
    save: "保存",
    all: "全部",
    active: "进行中",
    done: "已完成",
    labelFilter: "标签筛选",
    labelFilterAll: "全部标签",
    labelFilterNoLabel: "无标签",
    noTask: "暂无任务",
    allDone: "🎉🎉🎉 所有任务均已完成！好好休息一下吧！🎉🎉🎉",
    edit: "编辑",
    remove: "删除",
    pendingSummary: "您还有",
    pendingSuffix: "个任务待完成，预计",
    hourUnit: "小时",
    durationHourUnit: "小时",
    durationMinuteUnit: "分钟",
    durationSecondUnit: "秒",
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
    planNoActiveTasks: "没有可参与自动规划的任务：请先填写预计小时。",
    planSummary: "仅包含已填写预计时长的进行中任务；已按截止时间与优先级排序，建议如下：",
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
    addTaskHint: "· 标题为必填项。\n· 预计小时、截止时间、优先级均为选填。\n· 自动规划仅会纳入已填写预计小时的任务。\n· 截止时间和优先级会影响自动规划里的排序。",
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
      "算法步骤：\n1. 只纳入「进行中」且已填写预计时长的任务。\n2. 按截止时间从早到晚排序；无截止时间排在后面；同一截止时间内按优先级数字从小到大，0（未指定）放最后。\n3. 直接使用任务里填写的预计时长，不再推测工时。\n4. 按上述顺序将任务依次装入你输入的可用时长，直至时间用完或没有可装任务。",
    dataStats: "数据统计",
    dataStatsTitle: "数据统计",
    allTimeStats: "累计统计",
    weekStats: "最近一周",
    completedTasks: "已完成任务",
    totalHours: "任务时长",
    estimatedHoursStat: "预计时长",
    pomodoroHoursStat: "番茄钟时长",
    pomodoroManage: "番茄钟管理",
    pomodoroManageTitle: "番茄钟管理",
    pomodoroManageHint: "可在此修改已记录时长或删除记录。单任务番茄钟时长上限为 5 小时。",
    pomodoroManageEmpty: "暂无番茄钟记录。",
    pomodoroDateLabel: "日期",
    pomodoroNoRecordsForDate: "该日期暂无记录。",
    pomodoroLimitReached: "已达到番茄钟上限 5 小时，计时已强制停止。",
    pomodoroOnlyOne: "只能同时运行一个番茄钟",
    manageLabels: "管理标签",
    tagValidationEmpty: "标签不能为空",
    tagValidationTooLong: "标签长度不能超过20个字符",
    tagValidationDuplicate: "标签已存在",
    noLabels: "暂无标签",
    taskLabelsUpdated: "标签已保存",
    taskLabelDeleted: "标签已删除",
    labelDeleteConfirmTitle: "删除被占用标签",
    labelDeleteConfirmMessagePrefix: "标签",
    labelDeleteConfirmMessageSuffix: "正在被部分任务使用。继续删除将清空这些任务的标签字段，任务本身不会删除。",
    labelDeleteConfirmUsageCount: "当前占用任务数：{count}",
    labelDeleteConfirmContinue: "继续删除",
    pomodoroRecordUpdated: "番茄钟记录已更新。",
    pomodoroRecordDeleted: "番茄钟记录已删除。",
    statsDescription: "累计已完成的任务统计。最近一周基于过去7天内完成的任务。",
    recordedTime: "已计时",
    editTaskSuccess: "编辑任务成功。",
    submitting: "提交中...",
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
    repeatUntilHint: "最多重复 30 次（含当前任务）。",
    repeatNextPreview: "下次生成时间",
    repeatNextPreviewEmpty: "请先设置截止日期和重复规则。",
    repeatUntilRequired: "请设置重复截止日期。",
    repeatUntilBeforeStart: "重复截止日期不能早于开始日期。",
    repeatUntilMaxDaysError: "重复次数最多 30 次。",
    aboutUs: "关于我们",
    aboutSummary: "TaskEase 是一个本地优先的任务管理与番茄钟桌面应用，数据全部保存在你自己的电脑上，无需联网、无需账号。",
    aboutFeatureCalendar: "提供日历视图和拖拽改期。",
    aboutFeatureRecurring: "支持每日/每周/每月重复任务。",
    aboutFeatureSync: "支持本地存储与 Supabase 云同步。",
    aboutFeatureI18n: "支持简体中文与英文。",
    aboutRepo: "GitHub 仓库",
    remark: "备注",
    weekdays: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
  },
  en: {
    settings: "Settings",
    confirm: "Confirm",
    add: "Add",
    delete: "Delete",
    themeLabel: "Appearance",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    loadingData: "Loading data…",
    dataLocation: "Data location",
    dataBackup: "Data & Backup",
    dataLocationDesktop: "SQLite database (stored in the Windows AppData folder)",
    dataLocationWeb: "Browser local storage (localStorage)",
    datePlaceholder: "yyyy/mm/dd",
    backupSection: "Backup",
    backupHint: "The backup is a readable JSON file containing all tasks, Pomodoro sessions and labels.",
    backupRestoreHint: "You can save the backup anywhere; use “Import backup” to restore it.",
    exportBackup: "Export backup",
    exportBackupSuccess: "Backup exported.",
    exportBackupFailed: "Failed to export backup.",
    importBackup: "Import backup",
    importBackupConfirmTitle: "Import backup?",
    importBackupConfirmMessage: "Importing overwrites all current tasks, Pomodoro sessions and labels. This cannot be undone. Export your current data first.",
    importBackupConfirm: "Import",
    importBackupSuccess: "Imported:",
    importBackupFailed: "Failed to import backup.",
    unitTasks: "tasks",
    unitSessions: "sessions",
    language: "Language",
    clockFormat: "Clock Format",
    close: "Close",
    addTask: "Add Task",
    save: "Save",
    all: "All",
    active: "Active",
    done: "Completed",
    labelFilter: "Filter by Label",
    labelFilterAll: "All Labels",
    labelFilterNoLabel: "No Label",
    noTask: "No tasks",
    allDone: "🎉🎉🎉 All tasks are completed! Take a good break! 🎉🎉🎉",
    edit: "Edit",
    remove: "Delete",
    pendingSummary: "You still have",
    pendingSuffix: "tasks pending, estimated",
    hourUnit: "hours",
    durationHourUnit: "h",
    durationMinuteUnit: "m",
    durationSecondUnit: "s",
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
    planNoActiveTasks: "No tasks qualify for auto-plan: fill estimated hours first.",
    planSummary: "Includes only active tasks with estimated hours filled in; ordered by due date and priority:",
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
    addTaskHint: "· Title is required.\n· Estimated hours, due time, and priority are optional.\n· Auto-plan only includes tasks with estimated hours filled in.\n· Due time and priority affect ordering inside auto-plan.",
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
      "How it works:\n1. Only active tasks with estimated hours filled in.\n2. Sort by earliest due time first; tasks without a due time go last; tie-break by lower priority number, with 0 (unspecified) last.\n3. Use the entered estimated hours directly; no inference is applied.\n4. Greedily pack tasks into your available time budget in that order until time runs out.",
    dataStats: "Data Statistics",
    dataStatsTitle: "Data Statistics",
    allTimeStats: "All Time",
    weekStats: "This Week",
    completedTasks: "Completed",
    totalHours: "Total Hours",
    estimatedHoursStat: "Estimated Hours",
    pomodoroHoursStat: "Pomodoro Hours",
    pomodoroManage: "Pomodoro Manager",
    pomodoroManageTitle: "Pomodoro Manager",
    pomodoroManageHint: "Edit tracked time or delete records here. Per-task Pomodoro tracking is capped at 5 hours.",
    pomodoroManageEmpty: "No Pomodoro records yet.",
    pomodoroDateLabel: "Date",
    pomodoroNoRecordsForDate: "No records for this date.",
    pomodoroLimitReached: "Pomodoro hit the 5-hour limit and was stopped automatically.",
    pomodoroOnlyOne: "Only one Pomodoro can run at a time",
    pomodoroRecordUpdated: "Pomodoro record updated.",
    pomodoroRecordDeleted: "Pomodoro record deleted.",
    manageLabels: "Manage Labels",
    tagValidationEmpty: "Label cannot be empty",
    tagValidationTooLong: "Label length cannot exceed 20 characters",
    tagValidationDuplicate: "Label already exists",
    noLabels: "No labels yet",
    taskLabelsUpdated: "Labels saved",
    taskLabelDeleted: "Label deleted",
    labelDeleteConfirmTitle: "Delete Label In Use",
    labelDeleteConfirmMessagePrefix: "Label",
    labelDeleteConfirmMessageSuffix: "is used by some tasks. Continue will clear this label from those tasks, without deleting task rows.",
    labelDeleteConfirmUsageCount: "Tasks using this label: {count}",
    labelDeleteConfirmContinue: "Continue Deletion",
    statsDescription: "Statistics on all completed tasks. This week counts tasks completed in the past 7 days.",
    recordedTime: "Tracked",
    editTaskSuccess: "Task edited successfully.",
    submitting: "Submitting...",
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
    repeatUntilHint: "Up to 30 occurrences (including current task).",
    repeatNextPreview: "Next generated time",
    repeatNextPreviewEmpty: "Set due date and repeat rule first.",
    repeatUntilRequired: "Please set a repeat end date.",
    repeatUntilBeforeStart: "Repeat end date cannot be earlier than start date.",
    repeatUntilMaxDaysError: "Repeat occurrences can be at most 30.",
    aboutUs: "About",
    aboutSummary: "TaskEase is a local-first desktop app for task management and Pomodoro tracking. All data stays on your own machine — no account, no internet required.",
    aboutFeatureCalendar: "Calendar view with drag-to-reschedule.",
    aboutFeatureRecurring: "Daily/weekly/monthly recurring tasks.",
    aboutFeatureSync: "Local storage with optional Supabase cloud sync.",
    aboutFeatureI18n: "Supports Simplified Chinese and English.",
    aboutRepo: "GitHub Repository",
    remark: "Remark",
    weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  },
};

/**
 * 持久化辅助：全部委托给 src/storage 适配器。
 * 桌面版落到 SQLite 文件，网页版落到 localStorage，业务代码无感知。
 */
let storageErrorHandler = null;

function reportStorageError(scope, error) {
  console.error(`[storage] ${scope}失败`, error);
  if (typeof storageErrorHandler === "function") storageErrorHandler(scope, error);
}

function persistTodos(list) {
  return storage.saveTodos(list).catch((error) => {
    reportStorageError("任务写入", error);
    return false;
  });
}

function persistSessions(list) {
  return storage.saveSessions(list).catch((error) => {
    reportStorageError("番茄钟写入", error);
    return false;
  });
}

function persistSessionDeletion(id) {
  return storage.deleteSession(id).catch((error) => {
    reportStorageError("番茄钟删除", error);
    return false;
  });
}

function persistTaskLabels(list) {
  return storage.saveTaskLabels(list).catch((error) => {
    reportStorageError("标签写入", error);
    return false;
  });
}

/** 从存储读出的任务需要做一次兼容性归一化（历史版本把重复规则塞在 remark 里） */
function normalizeStoredTodo(item) {
  const parsedRepeat = parseLegacyRepeatFromRemark(item?.remark ?? "");
  return {
    ...item,
    remark: sanitizeRemark(item?.remark ?? ""),
    repeat_rule: normalizeRepeatRule(item?.repeat_rule ?? parsedRepeat.repeat_rule),
    repeat_until_date: normalizeRepeatUntilDate(item?.repeat_until_date ?? parsedRepeat.repeat_until_date),
    pomodoro_total_seconds: Math.max(0, Number(item?.pomodoro_total_seconds ?? 0)),
    progress_percent: normalizeProgress(item?.progress_percent),
    estimated_hours: Number(item?.estimated_hours ?? 0),
    priority: Number(item?.priority ?? 0),
  };
}

function mapPomodoroSession(row) {
  const durationSeconds = Math.max(0, Number(row?.duration_seconds ?? 0));
  const startTime = String(row?.start_time || "").trim();
  const endTime = String(row?.end_time || "").trim();
  const normalizedId = String(row?.id || "").trim();
  const sessionKey = String(row?.session_key || "").trim();
  return {
    id: normalizedId,
    task_id: row?.task_id ?? null,
    task_title: String(row?.task_title || "").trim(),
    session_key: sessionKey || normalizedId,
    duration_seconds: durationSeconds,
    start_time: startTime,
    end_time: endTime,
    user_id: row?.user_id ?? null,
    local_dirty: Boolean(row?.local_dirty),
    local_updated_at: String(row?.local_updated_at || "").trim(),
  };
}

/** 从存储读出的番茄钟会话：去重 + 映射 + 按开始时间倒序 */
function normalizeStoredSessions(list) {
  return dedupePomodoroSessionList(Array.isArray(list) ? list : [])
    .map(mapPomodoroSession)
    .filter((item) => item && item.id)
    .sort((a, b) => toTs(b.start_time) - toTs(a.start_time));
}

function buildPomodoroTotalsByTaskId(sessions) {
  const totals = {};
  for (const session of Array.isArray(sessions) ? sessions : []) {
    const taskId = String(session?.task_id || "").trim();
    if (!taskId) continue;
    totals[taskId] = Math.max(0, Number(totals[taskId] || 0) + Number(session?.duration_seconds || 0));
  }
  return totals;
}

function applyPomodoroTotalsFromSessions(todoList, sessions) {
  return applyPomodoroTotals(todoList, buildPomodoroTotalsByTaskId(sessions));
}

function snapProgress(v) {
  const x = Number(v);
  if (!Number.isFinite(x)) return 0;
  const c = Math.round(x / 10) * 10;
  return Math.max(0, Math.min(100, c));
}

function normalizeProgress(v) {
  const x = Number(v);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
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
const LEGACY_POMODORO_MARKER_REGEX = /\[pomo:\d+\]/gi;

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
  return normalizeDateKey(d.toISOString().slice(0, 10));
}

function parseLegacyRepeatFromRemark(rawRemark) {
  const value = String(rawRemark || "");
  const repeatMatch = [...value.matchAll(REPEAT_MARKER_REGEX)].pop();
  const untilMatch = [...value.matchAll(REPEAT_UNTIL_MARKER_REGEX)].pop();
  const repeat_rule = normalizeRepeatRule(repeatMatch?.[1] || "none");
  const repeat_until_date = normalizeRepeatUntilDate(untilMatch?.[1] || "");
  return { repeat_rule, repeat_until_date };
}

function sanitizeRemark(rawRemark) {
  return String(rawRemark || "")
    .replace(REPEAT_MARKER_REGEX, "")
    .replace(REPEAT_UNTIL_MARKER_REGEX, "")
    .replace(LEGACY_POMODORO_MARKER_REGEX, "")
    .trim();
}

function getNextRecurringDdl(ddl, repeatRule) {
  return getNextRecurringIso(ddl, normalizeRepeatRule(repeatRule));
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

function extractTaskLabelsFromTodos(todoList) {
  if (!Array.isArray(todoList)) return [];
  return todoList
    .map((todo) => String(todo?.label || "").trim())
    .filter(Boolean);
}

function mergeTaskLabels(...sources) {
  const deduped = new Map();
  for (const source of sources) {
    if (!Array.isArray(source)) continue;
    for (const raw of source) {
      const value = String(raw || "").trim();
      if (!value) continue;
      const key = value.toLowerCase();
      if (!deduped.has(key)) deduped.set(key, value);
    }
  }
  return Array.from(deduped.values());
}

function mapTodo(row) {
  const rawStatus = String(row.status ?? STATUS_PENDING).trim();
  const status = rawStatus === STATUS_DELETED ? STATUS_DELETED : rawStatus;
  const legacyRepeat = parseLegacyRepeatFromRemark(row.remark ?? "");
  const repeat_rule = normalizeRepeatRule(row.repeat_rule ?? legacyRepeat.repeat_rule);
  const repeat_until_date = normalizeRepeatUntilDate(row.repeat_until_date ?? legacyRepeat.repeat_until_date);
  return {
    id: row.id,
    title: row.title || "",
    status,
    estimated_hours: Number(row.estimated_hours ?? 0),
    ddl: row.ddl ?? null,
    remark: sanitizeRemark(row.remark ?? ""),
    repeat_rule,
    repeat_until_date,
    pomodoro_total_seconds: Math.max(0, Number(row.pomodoro_total_seconds ?? 0)),
    priority: Number(row.priority ?? 0),
    label: row.label ?? "",
    progress_percent: normalizeProgress(row.progress_percent ?? 0),
    user_id: row.user_id,
    created_at: row.created_at,
    local_dirty: Boolean(row.local_dirty),
    local_updated_at: row.local_updated_at || "",
    deleted_at: row.deleted_at || "",
  };
}

function applyPomodoroTotals(todoList, totalsByTaskId) {
  const source = Array.isArray(todoList) ? todoList : [];
  const totals = totalsByTaskId && typeof totalsByTaskId === "object" ? totalsByTaskId : {};
  return source.map((todo) => {
    const id = String(todo?.id || "").trim();
    const totalSeconds = id ? Math.max(0, Number(totals[id] || 0)) : 0;
    return {
      ...todo,
      pomodoro_total_seconds: totalSeconds,
    };
  });
}

function toTs(value, fallback = 0) {
  const ts = new Date(value || "").getTime();
  return Number.isFinite(ts) ? ts : fallback;
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
  const SUBMIT_WATCHDOG_MS = 12000;

  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "zh-CN" || saved === "en") return saved;
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

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPlanWorkModalOpen, setIsPlanWorkModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isDataBackupOpen, setIsDataBackupOpen] = useState(false);
  const [isDataStatsModalOpen, setIsDataStatsModalOpen] = useState(false);
  const [isPomodoroManageOpen, setIsPomodoroManageOpen] = useState(false);
  const [isPomodoroManageSaving, setIsPomodoroManageSaving] = useState(false);
  const [pomodoroSessions, setPomodoroSessions] = useState([]);
  const [isPomodoroSessionLoading, setIsPomodoroSessionLoading] = useState(false);
  const [isTaskLabelsModalOpen, setIsTaskLabelsModalOpen] = useState(false);
  const [taskLabels, setTaskLabels] = useState([]);
  // 持久层就绪前不渲染主界面（桌面端涉及数据库加载）
  const [storageReady, setStorageReady] = useState(false);

  const [notice, setNotice] = useState({ text: "", warning: false });

  const [filter, setFilter] = useState("all");
  const [labelFilter, setLabelFilter] = useState("");
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
  const [labelDeleteConfirmOpen, setLabelDeleteConfirmOpen] = useState(false);
  const [pendingLabelDelete, setPendingLabelDelete] = useState(null);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const [pendingDuplicatePayload, setPendingDuplicatePayload] = useState(null);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const loadPomodoroSessionsRef = useRef(null);
  // 番茄钟会话的内存镜像：让事件处理函数能同步读到当前列表，无需为读数据再走一次磁盘
  const sessionsRef = useRef([]);

  const [todos, setTodos] = useState([]);
  const [timerTaskId, setTimerTaskId] = useState(null);
  const [timerSession, setTimerSession] = useState({
    taskId: null,
    totalSeconds: 0,
    displaySeconds: 0,
    isRunning: false,
    startedAt: null,
  });
  const currentTimerTask = timerTaskId ? todos.find((t) => t.id === timerTaskId) : null;
  const pomodoroRecords = useMemo(() => {
    return todos.filter((item) => Math.max(0, Number(item?.pomodoro_total_seconds || 0)) > 0 && item?.status !== STATUS_DELETED);
  }, [todos]);
  const pomodoroTaskTitleById = useMemo(() => {
    const map = {};
    for (const todo of Array.isArray(todos) ? todos : []) {
      const todoId = String(todo?.id || "").trim();
      if (!todoId || todo?.status === STATUS_DELETED) continue;
      const title = String(todo?.title || "").trim();
      if (title) map[todoId] = title;
    }
    return map;
  }, [todos]);

  const t = TEXT[lang];
  // 日期时间格式化统一用它，避免跟随系统语言导致中英混搭
  const appLocale = getAppLocale(lang);

  loadPomodoroSessionsRef.current = loadPomodoroSessions;
  // 持久层出错时统一提示（避免静默丢数据）
  storageErrorHandler = (scope, error) => {
    setNotice({ text: `${scope}失败：${String(error?.message || error)}`, warning: true });
  };

  const themeColors = getThemeColors(resolvedTheme);
  const { pageBg, panelBg, listBg, logoColor } = themeColors;

  function notify(text, warning = true) {
    setNotice({ text, warning });
    window.setTimeout(() => {
      setNotice((prev) => (prev.text === text ? { text: "", warning: false } : prev));
    }, 4500);
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

  // 启动时从持久层加载全部数据（桌面版 = SQLite，网页版 = localStorage）。
  // 在加载完成前不渲染主界面，从根本上避免「用户已改数据但初始加载把它覆盖掉」的竞态。
  /** 把持久层里的全部数据读回内存（启动时与导入备份后都会调用） */
  async function reloadFromStorage() {
    const [todoRows, sessionRows, labelRows] = await Promise.all([
      storage.loadTodos(),
      storage.loadSessions(),
      storage.loadTaskLabels(),
    ]);
    const sessions = normalizeStoredSessions(sessionRows);
    const todos = (Array.isArray(todoRows) ? todoRows : []).map(normalizeStoredTodo);
    const labels = parseTaskLabels(Array.isArray(labelRows) ? labelRows : []);

    applySessions(sessions);
    setTodos(applyPomodoroTotalsFromSessions(todos, sessions));
    setTaskLabels(labels);
    return { todos: todos.length, sessions: sessions.length, labels: labels.length };
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const startedAt = Date.now();
      try {
        await storage.init();
        const counts = await reloadFromStorage();
        if (cancelled) return;

        console.info(
          `[storage] 适配器=${storage.kind} 任务=${counts.todos} 会话=${counts.sessions} 标签=${counts.labels} 耗时=${Date.now() - startedAt}ms`,
        );
      } catch (error) {
        reportStorageError("初始化", error);
        if (!cancelled) notify(`数据加载失败：${String(error?.message || error)}`, true);
      } finally {
        if (!cancelled) setStorageReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // 只在挂载时执行一次：reloadFromStorage 仅依赖稳定的 setState 与 ref，无外部可变值
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const labelsFromTodos = extractTaskLabelsFromTodos(todos);
    if (labelsFromTodos.length === 0) return;

    const merged = mergeTaskLabels(taskLabels, labelsFromTodos)
      .sort((a, b) => a.localeCompare(b, lang === "en" ? "en-US" : lang));

    const isUnchanged =
      merged.length === taskLabels.length &&
      merged.every((label, idx) => label === taskLabels[idx]);
    if (isUnchanged) return;

    setTaskLabels(merged);
    void persistTaskLabels(merged);
  }, [todos, taskLabels, lang]);

  const mergedTaskLabels = useMemo(() => {
    const fromTodos = todos
      .filter((x) => x.status !== STATUS_DELETED)
      .map((x) => String(x.label || "").trim())
      .filter(Boolean);
    const set = new Set([...taskLabels.map((x) => String(x).trim()).filter(Boolean), ...fromTodos]);
    return Array.from(set).sort((a, b) => a.localeCompare(b, lang));
  }, [todos, taskLabels, lang]);

  const visibleTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (todo.status === STATUS_DELETED) return false;
      if (filter === "active" && todo.status === STATUS_DONE) return false;
      if (filter === "done" && todo.status !== STATUS_DONE) return false;
      const taskLabel = String(todo.label || "").trim();
      if (labelFilter === LABEL_FILTER_UNLABELED && taskLabel) return false;
      if (labelFilter && labelFilter !== LABEL_FILTER_UNLABELED && taskLabel !== labelFilter) return false;
      return true;
    });
  }, [todos, filter, labelFilter]);

  const pendingTodos = useMemo(
    () => todos.filter((item) => item.status !== STATUS_DONE && item.status !== STATUS_DELETED),
    [todos],
  );

  const estimateHours = useMemo(() => {
    const sum = pendingTodos.reduce((acc, item) => acc + Number(item.estimated_hours || 0), 0);
    return Number.isFinite(sum) ? sum.toFixed(1) : "0.0";
  }, [pendingTodos]);

  useEffect(() => {
    if (!labelFilter || labelFilter === LABEL_FILTER_UNLABELED) return;
    if (!mergedTaskLabels.includes(labelFilter)) {
      setLabelFilter("");
    }
  }, [labelFilter, mergedTaskLabels]);

  const clock = getClockParts(now, lang, clockFormat);

  /** 设置会话列表的同时维护内存镜像 */
  function applySessions(next) {
    sessionsRef.current = Array.isArray(next) ? next : [];
    setPomodoroSessions(sessionsRef.current);
  }

  /** 从持久层重新读取番茄钟会话（用于「番茄钟管理」弹窗打开时刷新） */
  async function loadPomodoroSessions() {
    const rows = await storage.loadSessions();
    return normalizeStoredSessions(rows);
  }

  async function saveTaskLabels(labels) {
    try {
      const normalizedLabels = Array.isArray(labels)
        ? labels.map((l) => String(l || "").trim()).filter(Boolean)
        : [];
      const labelsFromTodos = extractTaskLabelsFromTodos(todos.filter((x) => x.status !== STATUS_DELETED));
      const mergedLabels = mergeTaskLabels(normalizedLabels, labelsFromTodos)
        .sort((a, b) => a.localeCompare(b, lang === "en" ? "en-US" : lang));

      setTaskLabels(mergedLabels);
      void persistTaskLabels(mergedLabels);
      notify(t.taskLabelsUpdated || "标签已保存", false);
      return true;
    } catch (error) {
      pushDiag("labels", "save_error", { error: String(error?.message || error) }, "warn");
      notify(String(error?.message || "无法保存标签"), true);
      return false;
    }
  }

  function getLabelKey(value) {
    return String(value || "").trim().toLowerCase();
  }

  function removeLabelFromTodosAndLibrary(label) {
    const key = getLabelKey(label);
    if (!key) return;
    const nowIso = new Date().toISOString();

    setTodos((prev) => {
      const next = (Array.isArray(prev) ? prev : []).map((todo) => {
        if (!todo || todo.status === STATUS_DELETED) return todo;
        if (getLabelKey(todo.label) !== key) return todo;
        return {
          ...todo,
          label: "",
          local_dirty: true,
          local_updated_at: nowIso,
        };
      });
      void persistTodos(next);
      return next;
    });

    const nextLabels = taskLabels.filter((x) => getLabelKey(x) !== key);
    setTaskLabels(nextLabels);
    void persistTaskLabels(nextLabels);

    setDraft((prev) => (getLabelKey(prev?.label) === key ? { ...prev, label: "" } : prev));
    notify(t.taskLabelDeleted || "标签已删除", false);
  }

  function handleRequestDeleteTaskLabel(label) {
    const key = getLabelKey(label);
    if (!key) return;
    const inUseCount = todos.filter((todo) => todo?.status !== STATUS_DELETED && getLabelKey(todo?.label) === key).length;
    if (inUseCount > 0) {
      setPendingLabelDelete({ label: String(label || "").trim(), inUseCount });
      setLabelDeleteConfirmOpen(true);
      return;
    }
    removeLabelFromTodosAndLibrary(label);
  }

  function confirmDeleteTaskLabelInUse() {
    const label = String(pendingLabelDelete?.label || "").trim();
    if (!label) return;
    removeLabelFromTodosAndLibrary(label);
    setLabelDeleteConfirmOpen(false);
    setPendingLabelDelete(null);
  }

  function syncLocal(nextTodos) {
    void persistTodos(nextTodos);
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
    const next = mergeTaskLabels(taskLabels, [trimmed]).sort((a, b) => a.localeCompare(b, lang === "en" ? "en-US" : lang));
    setTaskLabels(next);
    void persistTaskLabels(next);
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
        const occurrences = countOccurrencesByRule(startDateKey, repeat_until_date, repeat_rule);
        if (occurrences > 30) {
          notify(t.repeatUntilMaxDaysError, true);
          return;
        }
      }

      const remark = sanitizeRemark(sourceDraft.remark) || null;

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
        notify(t.editTaskSuccess, false);
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
        repeat_rule,
        repeat_until_date,
        priority,
        label,
        progress_percent: 0,
        created_at: new Date().toISOString(),
        local_dirty: true,
        local_updated_at: new Date().toISOString(),
      };

      // Local-first mode: add task immediately to local store.
      pushDiag("taskSubmit", "local_insert", { taskId: payload.id });
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
    });
  }

  async function updateTodo(id, patch, options = {}) {
    const { snapProgressToStep = false } = options;
    const previous = todos;
    const targetBefore = previous.find((item) => item.id === id);
    if (!targetBefore) return;

    const nextPatch = { ...patch };
    if (nextPatch.progress_percent != null) {
      nextPatch.progress_percent = snapProgressToStep
        ? snapProgress(nextPatch.progress_percent)
        : normalizeProgress(nextPatch.progress_percent);
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
      nextPatch.remark = sanitizeRemark(rawRemark) || null;
      nextPatch.repeat_rule = effectiveRepeat;
      nextPatch.repeat_until_date = effectiveRepeatUntil;
    }

    const uiPatch = { ...nextPatch };
    if (hasRepeatPatch || hasRepeatUntilPatch || hasRemarkPatch) {
      uiPatch.remark = sanitizeRemark(uiPatch.remark ?? targetBefore.remark);
      uiPatch.repeat_rule = normalizeRepeatRule(uiPatch.repeat_rule ?? targetBefore.repeat_rule);
      uiPatch.repeat_until_date = normalizeRepeatUntilDate(uiPatch.repeat_until_date ?? targetBefore.repeat_until_date);
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
        remark: sanitizeRemark(baseTodo.remark) || null,
        repeat_rule: repeatRule,
        repeat_until_date: repeatUntilDate,
        priority: Number(baseTodo.priority || 0),
        label: baseTodo.label || null,
        progress_percent: 0,
        created_at: new Date().toISOString(),
        user_id: null,
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

  function handleStartTimer(taskId) {
    // Check if there's already an active timer for a different task
    if (timerTaskId && timerTaskId !== taskId) {
      notify(t.pomodoroOnlyOne || "只能同时运行一个番茄钟", true);
      return;
    }
    
    setTimerTaskId(taskId);
    const task = todos.find((item) => item.id === taskId);
    const baseSeconds = Math.max(0, Number(task?.pomodoro_total_seconds || 0));
    setTimerSession({
      taskId,
      totalSeconds: baseSeconds,
      displaySeconds: baseSeconds,
      isRunning: false,
      startedAt: null,
    });
  }

  const handleTimerSessionChange = useCallback((nextSession) => {
    setTimerSession((prev) => {
      const next = {
        ...prev,
        ...nextSession,
      };
      if (
        prev.taskId === next.taskId &&
        prev.totalSeconds === next.totalSeconds &&
        prev.displaySeconds === next.displaySeconds &&
        prev.isRunning === next.isRunning &&
        prev.startedAt === next.startedAt
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  function handleTimerSessionPersist(nextSession) {
    if (!nextSession?.taskId) return;
    setTimerSession((prev) => {
      const next = {
        ...prev,
        ...nextSession,
      };
      if (
        prev.taskId === next.taskId &&
        prev.totalSeconds === next.totalSeconds &&
        prev.displaySeconds === next.displaySeconds &&
        prev.isRunning === next.isRunning &&
        prev.startedAt === next.startedAt
      ) {
        return prev;
      }
      return next;
    });
  }

  async function persistPomodoroSessionRecord({ taskId, startedAt: _startedAt, endedAt, sessionSeconds }) {
    if (!taskId) return false;
    const durationSeconds = Math.max(0, Math.floor(Number(sessionSeconds || 0)));
    if (durationSeconds < POMODORO_MIN_RECORD_SECONDS) return false;

    // Use precise timestamps, with endedAt as primary reference
    const endTs = Number.isFinite(Number(endedAt)) ? Number(endedAt) : Date.now();
    // Calculate startTs based on endTs and duration for consistency
    const startTs = endTs - (durationSeconds * 1000);
    
    // Round to nearest second for consistency in database lookups
    const startTimeMs = Math.round(startTs / 1000) * 1000;
    const endTimeMs = Math.round(endTs / 1000) * 1000;
    
    const nextSession = {
      id: crypto.randomUUID(),
      session_key: crypto.randomUUID(),
      user_id: null,
      task_id: taskId,
      duration_seconds: durationSeconds,
      start_time: new Date(startTimeMs).toISOString(),
      end_time: new Date(endTimeMs).toISOString(),
      local_dirty: true,
      local_updated_at: new Date().toISOString(),
    };

    // 防重：同一个 session_key 已存在就不再写入
    const existingSessions = sessionsRef.current;
    const isDuplicate = existingSessions.some((session) => String(session.session_key || "").trim() === String(nextSession.session_key).trim());

    if (isDuplicate) {
      pushDiag("pomodoro", "session_duplicate_prevented", { taskId, durationSeconds }, "warn");
      return false;
    }

    const sessions = [nextSession, ...existingSessions];
    applySessions(sessions);
    void persistSessions(sessions);

    setTodos((prev) => {
      let next = applyPomodoroTotalsFromSessions(prev, sessions);
      const taskIndex = next.findIndex((item) => item.id === taskId);
      if (taskIndex >= 0) {
        const task = next[taskIndex];
        const estimatedHours = Number(task?.estimated_hours || 0);
        const baseProgress = normalizeProgress(task.progress_percent);
        const nextProgress = applyPomodoroStopProgress(baseProgress, estimatedHours, durationSeconds);
        if (nextProgress !== baseProgress) {
          const localUpdateTs = new Date().toISOString();
          next = next.map((item, index) =>
            index === taskIndex
              ? {
                  ...item,
                  progress_percent: nextProgress,
                  local_dirty: true,
                  local_updated_at: localUpdateTs,
                }
              : item,
          );
        }
      }

      void persistTodos(next);
      return next;
    });
    pushDiag("pomodoro", "session_insert_local_success", { taskId, durationSeconds });
    return true;
  }

  useEffect(() => {
    if (!isPomodoroManageOpen) return;
    let cancelled = false;

    setIsPomodoroSessionLoading(true);

    async function refreshSessionsWhenManageOpens() {
      try {
        const loader = loadPomodoroSessionsRef.current;
        if (typeof loader !== "function") return;
        const sessions = await loader();
        if (cancelled) return;
        applySessions(sessions);
        setIsPomodoroSessionLoading(false);
        pushDiag("pomodoro", "manager_modal_refresh_success", { count: sessions.length });
      } catch (err) {
        if (cancelled) return;
        setIsPomodoroSessionLoading(false);
        pushDiag("pomodoro", "manager_modal_refresh_error", { error: String(err?.message || err) }, "warn");
      }
    }

    void refreshSessionsWhenManageOpens();

    return () => {
      cancelled = true;
    };
  }, [isPomodoroManageOpen]);

  async function handleStopTimer(nextSession = timerSession) {
    if (nextSession?.reason === "limit_reached") {
      notify(t.pomodoroLimitReached, false);
    }
    if (!nextSession?.taskId) {
      setTimerTaskId(null);
      setTimerSession({ taskId: null, totalSeconds: 0, displaySeconds: 0, isRunning: false, startedAt: null });
      return;
    }
    
    // Only persist session record if it has actual duration
    if (Number(nextSession?.sessionSeconds || 0) >= POMODORO_MIN_RECORD_SECONDS) {
      await persistPomodoroSessionRecord({
        taskId: nextSession.taskId,
        startedAt: nextSession.startedAt,
        endedAt: nextSession.endedAt,
        sessionSeconds: nextSession.sessionSeconds,
      });
    }
    setTimerTaskId(null);
    setTimerSession({ taskId: null, totalSeconds: 0, displaySeconds: 0, isRunning: false, startedAt: null });
  }

  async function handleSavePomodoroRecord(sessionId, totalSeconds) {
    if (!sessionId) return false;
    setIsPomodoroManageSaving(true);
    try {
      const normalizedSeconds = Math.max(0, Math.min(POMODORO_MAX_SECONDS, Math.floor(Number(totalSeconds || 0))));
      const currentSessions = sessionsRef.current;
      const sessionToUpdate = currentSessions.find((s) => s.id === sessionId);
      if (!sessionToUpdate) return false;

      const updatedSessions = currentSessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              duration_seconds: normalizedSeconds,
              end_time: new Date(new Date(session.start_time).getTime() + normalizedSeconds * 1000).toISOString(),
              local_dirty: true,
              local_updated_at: new Date().toISOString(),
            }
          : session,
      );

      applySessions(updatedSessions);
      void persistSessions(updatedSessions);
      setTodos((prev) => {
        const next = applyPomodoroTotalsFromSessions(prev, updatedSessions);
        void persistTodos(next);
        return next;
      });
      notify(t.pomodoroRecordUpdated, false);
      return true;
    } finally {
      setIsPomodoroManageSaving(false);
    }
  }

  async function handleDeletePomodoroRecord(sessionId) {
    if (!sessionId) return false;
    setIsPomodoroManageSaving(true);
    try {
      const currentSessions = sessionsRef.current;
      const updatedSessions = currentSessions.filter((session) => session.id !== sessionId);

      if (updatedSessions.length === currentSessions.length) return false;

      applySessions(updatedSessions);
      // 会话是物理删除：先删掉这条，再把剩余整体 upsert 回去
      void persistSessionDeletion(sessionId);
      void persistSessions(updatedSessions);
      setTodos((prev) => {
        const next = applyPomodoroTotalsFromSessions(prev, updatedSessions);
        void persistTodos(next);
        return next;
      });
      notify(t.pomodoroRecordDeleted, false);
      return true;
    } finally {
      setIsPomodoroManageSaving(false);
    }
  }


  // 持久层就绪前显示加载态：从根上杜渐「异步加载结果覆盖掉用户刚做的修改」
  if (!storageReady) {
    return (
      <main
        className="d-flex align-items-center justify-content-center"
        style={{ minHeight: "100vh", backgroundColor: pageBg }}
      >
        <div className="text-center">
          <div className="spinner-border mb-3" style={{ color: logoColor }} role="status" aria-hidden="true" />
          <div className="small" style={{ color: logoColor }}>{t.loadingData}</div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="container-fluid py-3"
      style={{
        minHeight: "100vh",
        "--te-soft-btn": themeColors.softBtn,
        "--te-soft-btn-border": themeColors.softBtnBorder,
        "--te-range-track": themeColors.activeBtn,
        backgroundColor: pageBg,
      }}
    >
      <div
        className="mx-auto"
        style={{
          maxWidth: "1120px",
        }}
      >
        <Toast notice={notice} onClose={() => setNotice({ text: "", warning: false })} />

        <Header
            t={t}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
            themeColors={themeColors}
            lang={lang}
            setLang={setLang}
            clockFormat={clockFormat}
            setClockFormat={setClockFormat}
            onOpenAbout={() => setIsAboutModalOpen(true)}
            onOpenDataStats={() => setIsDataStatsModalOpen(true)}
            onOpenPomodoroManage={() => {
              setIsPomodoroManageOpen(true);
            }}
            logoColor={logoColor}
            pageBg={pageBg}
            resolvedTheme={resolvedTheme}
            onOpenTaskLabelsModal={() => setIsTaskLabelsModalOpen(true)}
            onOpenDataBackup={() => setIsDataBackupOpen(true)}
          />

        <TaskManager
          t={t}
          lang={lang}
          clock={clock}
          pendingTodos={pendingTodos}
          estimateHours={estimateHours}
          filter={filter}
          setFilter={setFilter}
          labelFilter={labelFilter}
          setLabelFilter={setLabelFilter}
          unlabeledFilterValue={LABEL_FILTER_UNLABELED}
          labelOptions={mergedTaskLabels}
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
          timerSession={timerSession}
        />

        <AddTaskModal
          isOpen={isAddModalOpen}
          onClose={closeAddModal}
          t={t}
          locale={appLocale}
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

        <PlanWorkModal
          isOpen={isPlanWorkModalOpen}
          onClose={() => setIsPlanWorkModalOpen(false)}
          t={t}
          locale={appLocale}
          todos={todos}
          STATUS_DONE={STATUS_DONE}
          pageBg={pageBg}
          themeColors={themeColors}
        />

        <AboutModal
          isOpen={isAboutModalOpen}
          onClose={() => setIsAboutModalOpen(false)}
          t={t}
          pageBg={pageBg}
          repoUrl={PROJECT_REPO_URL}
        />

        <DataBackupModal
          isOpen={isDataBackupOpen}
          onClose={() => setIsDataBackupOpen(false)}
          t={t}
          pageBg={pageBg}
          themeColors={themeColors}
          onNotify={notify}
          onImported={reloadFromStorage}
        />

        <DataStatsModal
          isOpen={isDataStatsModalOpen}
          onClose={() => setIsDataStatsModalOpen(false)}
          t={t}
          pageBg={pageBg}
          themeColors={themeColors}
          todos={todos}
          STATUS_DONE={STATUS_DONE}
        />

        <PomodoroManagementModal
          isOpen={isPomodoroManageOpen}
          onClose={() => setIsPomodoroManageOpen(false)}
          t={t}
          locale={appLocale}
          pageBg={pageBg}
          themeColors={themeColors}
          resolvedTheme={resolvedTheme}
          records={pomodoroRecords}
          maxSeconds={POMODORO_MAX_SECONDS}
          onSave={handleSavePomodoroRecord}
          onDelete={handleDeletePomodoroRecord}
          isSaving={isPomodoroManageSaving}
          sessions={pomodoroSessions}
          taskTitleById={pomodoroTaskTitleById}
          isLoadingSession={isPomodoroSessionLoading}
        />

        <TaskLabelsModal
          isOpen={isTaskLabelsModalOpen}
          onClose={() => setIsTaskLabelsModalOpen(false)}
          t={t}
          labels={mergedTaskLabels}
          onLabelsChange={(newLabels) => saveTaskLabels(newLabels)}
          onRequestDeleteLabel={handleRequestDeleteTaskLabel}
          themeColors={themeColors}
          pageBg={pageBg}
          resolvedTheme={resolvedTheme}
        />

        <ConfirmModal
          isOpen={labelDeleteConfirmOpen}
          onClose={() => {
            setLabelDeleteConfirmOpen(false);
            setPendingLabelDelete(null);
          }}
          title={t.labelDeleteConfirmTitle}
          message={`${t.labelDeleteConfirmMessagePrefix} "${String(pendingLabelDelete?.label || "")}" ${t.labelDeleteConfirmMessageSuffix}\n${String(t.labelDeleteConfirmUsageCount || "Tasks using this label: {count}").replace("{count}", String(Number(pendingLabelDelete?.inUseCount || 0)))}`}
          confirmLabel={t.labelDeleteConfirmContinue}
          cancelLabel={t.cancel}
          closeAriaLabel={t.close}
          pageBg={pageBg}
          danger
          onConfirm={confirmDeleteTaskLabelInUse}
        />

        <PomodoroTimer
          isActive={timerTaskId !== null}
          taskData={currentTimerTask}
          onSessionChange={handleTimerSessionChange}
          onPersistSession={handleTimerSessionPersist}
          onStop={handleStopTimer}
          maxSeconds={POMODORO_MAX_SECONDS}
        />
      </div>
    </main>
  );
}
