import { useEffect, useMemo, useRef, useState } from "react";

export function TaskManager({
  t,
  lang,
  clock,
  pendingTodos,
  estimateHours,
  filter,
  setFilter,
  viewMode,
  setViewMode,
  visibleTodos,
  onAddTask,
  onOpenPlanWork,
  panelBg,
  listBg,
  themeColors,
  STATUS_DONE,
  STATUS_PENDING,
  updateTodo,
  onEditTodo,
  snapProgress,
  onStartTimer,
}) {
  const locale = lang === "en" ? "en-US" : lang;

  function yellowButtonStyle(active) {
    return {
      backgroundColor: active ? themeColors.activeBtn : themeColors.softBtn,
      color: "#2b2b2b",
      borderColor: active ? themeColors.activeBtnBorder : themeColors.softBtnBorder,
    };
  }

  const planBtnStyle = {
    backgroundColor: themeColors.softBtn,
    color: "#2b2b2b",
    borderColor: themeColors.softBtnBorder,
    fontWeight: 600,
  };

  function priorityNote(priority) {
    if (priority === 0) return t.priorityOpt0 || "0";
    if (priority === 1) return t.priorityOpt1 || "1";
    if (priority === 2) return t.priorityOpt2 || "2";
    if (priority === 3) return t.priorityOpt3 || "3";
    return String(priority);
  }

  function repeatRuleNote(rule) {
    if (rule === "daily") return t.repeatDaily;
    if (rule === "weekly") return t.repeatWeekly;
    if (rule === "monthly") return t.repeatMonthly;
    return t.repeatNone;
  }

  function toLocalDateKey(value) {
    const d = new Date(value || "");
    if (!Number.isFinite(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function toTime(value, fallback = 0) {
    const ts = new Date(value || "").getTime();
    return Number.isFinite(ts) ? ts : fallback;
  }

  function formatTimeOnly(iso) {
    const dt = new Date(iso || "");
    if (!Number.isFinite(dt.getTime())) return "--:--";
    return dt.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  function buildIsoByDateAndTime(dateKey, hhmm) {
    const date = String(dateKey || "").trim();
    if (!date) return null;
    const time = String(hhmm || "").trim() || "23:59";
    const d = new Date(`${date}T${time}`);
    if (!Number.isFinite(d.getTime())) return null;
    return d.toISOString();
  }

  function formatDue(iso) {
    const dt = new Date(iso || "");
    if (!Number.isFinite(dt.getTime())) return "";
    return dt.toLocaleString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function getDueDayDiff(iso) {
    const dt = new Date(iso || "");
    if (!Number.isFinite(dt.getTime())) return null;
    const today = new Date();
    const dueDay = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.round((dueDay.getTime() - todayDay.getTime()) / 86400000);
  }

  function formatDueWithDays(iso) {
    const base = formatDue(iso);
    const diff = getDueDayDiff(iso);
    if (!base || diff === null) return base;
    const label = diff >= 0 ? `${diff}天` : `-${Math.abs(diff)}天`;
    return `${base} (${label})`;
  }

  const [calendarCursor, setCalendarCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDateKey, setSelectedDateKey] = useState(() => toLocalDateKey(new Date()));
  const [taskAnimMap, setTaskAnimMap] = useState({});
  const [viewStageClass, setViewStageClass] = useState("te-view-in");
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);
  const taskAnimTimersRef = useRef([]);
  const viewSwitchTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      taskAnimTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      taskAnimTimersRef.current = [];
      if (viewSwitchTimerRef.current) {
        window.clearTimeout(viewSwitchTimerRef.current);
        viewSwitchTimerRef.current = null;
      }
    };
  }, []);

  function runViewTransition(changeFn) {
    if (isViewTransitioning) return;
    setIsViewTransitioning(true);
    setViewStageClass("te-view-out");
    if (viewSwitchTimerRef.current) window.clearTimeout(viewSwitchTimerRef.current);
    viewSwitchTimerRef.current = window.setTimeout(() => {
      changeFn();
      setViewStageClass("te-view-in");
      const doneTimer = window.setTimeout(() => {
        setIsViewTransitioning(false);
      }, 190);
      taskAnimTimersRef.current.push(doneTimer);
      viewSwitchTimerRef.current = null;
    }, 180);
  }

  function handleFilterSwitch(nextFilter) {
    if (nextFilter === filter) return;
    runViewTransition(() => setFilter(nextFilter));
  }

  function handleViewModeSwitch(nextMode) {
    if (nextMode === viewMode) return;
    runViewTransition(() => setViewMode(nextMode));
  }

  function setTaskAnim(todoId, className, duration = 260) {
    const key = String(todoId || "");
    if (!key) return;
    setTaskAnimMap((prev) => ({ ...prev, [key]: className }));
    const timerId = window.setTimeout(() => {
      setTaskAnimMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, duration);
    taskAnimTimersRef.current.push(timerId);
  }

  function handleStatusAction(todo, nextStatus) {
    if (!todo?.id) return;

    if (nextStatus === STATUS_DONE && filter === "all") {
      const id = String(todo.id);
      setTaskAnimMap((prev) => ({ ...prev, [id]: "te-task-fade-out" }));
      const timerId = window.setTimeout(() => {
        void updateTodo(todo.id, { status: STATUS_DONE, progress_percent: 100 });
        setTaskAnim(todo.id, "te-task-fade-in", 280);
      }, 180);
      taskAnimTimersRef.current.push(timerId);
      return;
    }

    if (nextStatus === STATUS_DONE && filter === "active") {
      setTaskAnim(todo.id, "te-task-exit-left", 280);
      const timerId = window.setTimeout(() => {
        void updateTodo(todo.id, { status: STATUS_DONE, progress_percent: 100 });
      }, 220);
      taskAnimTimersRef.current.push(timerId);
      return;
    }

    if (nextStatus === STATUS_PENDING && filter === "done") {
      setTaskAnim(todo.id, "te-task-fade-out", 220);
      const timerId = window.setTimeout(() => {
        void updateTodo(todo.id, {
          status: STATUS_PENDING,
          progress_percent: snapProgress(todo.progress_percent) >= 100 ? 90 : snapProgress(todo.progress_percent),
        });
      }, 170);
      taskAnimTimersRef.current.push(timerId);
      return;
    }

    if (nextStatus === STATUS_DONE) {
      void updateTodo(todo.id, { status: STATUS_DONE, progress_percent: 100 });
      return;
    }

    void updateTodo(todo.id, {
      status: STATUS_PENDING,
      progress_percent: snapProgress(todo.progress_percent) >= 100 ? 90 : snapProgress(todo.progress_percent),
    });
  }

  const sortedNoDue = [...visibleTodos]
    .filter((todo) => !todo.ddl)
    .sort((a, b) => toTime(a.created_at) - toTime(b.created_at));

  const sortedHasDue = [...visibleTodos]
    .filter((todo) => todo.ddl)
    .sort((a, b) => {
      const dueDiff = toTime(a.ddl) - toTime(b.ddl);
      if (dueDiff !== 0) return dueDiff;
      return toTime(a.created_at) - toTime(b.created_at);
    });

  const priorityGroups = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0]
    .map((level) => ({
      level,
      todos: visibleTodos
        .filter((todo) => Number(todo.priority || 0) === level)
        .sort((a, b) => toTime(a.created_at) - toTime(b.created_at)),
    }))
    .filter((group) => group.todos.length > 0);

  const priorityDashColors = {
    1: "#d9534f",
    2: "#f0ad4e",
    3: "#5bc0de",
    4: "#5cb85c",
    5: "#8a6d3b",
    6: "#7a92cc",
    7: "#7f8c8d",
    8: "#9b59b6",
    9: "#16a085",
    10: "#95a5a6",
    0: "#8a8a8a",
  };

  const calendarModel = useMemo(() => {
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const startDate = new Date(year, month, 1 - startWeekday);

    const tasksByDate = new Map();
    for (const todo of visibleTodos) {
      if (!todo.ddl) continue;
      const key = toLocalDateKey(todo.ddl);
      if (!key) continue;
      const list = tasksByDate.get(key) || [];
      list.push(todo);
      tasksByDate.set(key, list);
    }

    for (const [key, list] of tasksByDate.entries()) {
      list.sort((a, b) => toTime(a.ddl) - toTime(b.ddl));
      tasksByDate.set(key, list);
    }

    const cells = Array.from({ length: 42 }).map((_, index) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + index);
      const key = toLocalDateKey(d);
      return {
        key,
        day: d.getDate(),
        inCurrentMonth: d.getMonth() === month,
        tasks: tasksByDate.get(key) || [],
      };
    });

    return {
      monthLabel: firstDay.toLocaleDateString(locale, { year: "numeric", month: "long" }),
      cells,
      tasksByDate,
    };
  }, [calendarCursor, locale, visibleTodos]);

  const selectedDateTodos = useMemo(() => {
    return [...(calendarModel.tasksByDate.get(selectedDateKey) || [])].sort((a, b) => {
      const dueDiff = toTime(a.ddl) - toTime(b.ddl);
      if (dueDiff !== 0) return dueDiff;
      return toTime(a.created_at) - toTime(b.created_at);
    });
  }, [calendarModel.tasksByDate, selectedDateKey]);

  function handleTaskDropToDate(event, dateKey) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/task-id");
    if (!taskId || !dateKey) return;
    const todo = visibleTodos.find((item) => item.id === taskId);
    if (!todo) return;

    const baseDate = todo.ddl ? new Date(todo.ddl) : null;
    const hh = baseDate && Number.isFinite(baseDate.getTime()) ? String(baseDate.getHours()).padStart(2, "0") : "23";
    const mm = baseDate && Number.isFinite(baseDate.getTime()) ? String(baseDate.getMinutes()).padStart(2, "0") : "59";
    const nextIso = buildIsoByDateAndTime(dateKey, `${hh}:${mm}`);
    if (!nextIso) return;

    void updateTodo(taskId, { ddl: nextIso });
    setSelectedDateKey(dateKey);
  }

  function renderTaskItem(todo, idx) {
    const rowAnimClass = taskAnimMap[String(todo.id)] || "";
    return (
      <li key={todo.id} className={`list-group-item border-0 border-bottom te-task-row ${rowAnimClass}`} style={{ backgroundColor: listBg }}>
        <div className="d-flex gap-2 align-items-start flex-wrap flex-sm-nowrap">
          <div className="d-flex align-items-start gap-1 flex-shrink-0 pt-1">
            <span
              className="fw-bold text-body-secondary"
              style={{ fontSize: "1.35rem", minWidth: "2.5rem", fontFamily: "Manrope, Noto Sans SC, sans-serif" }}
            >
              {idx + 1}
            </span>
          </div>

          <div className="flex-grow-1 min-w-0" style={{ flexBasis: "16rem" }}>
            <div
              className={`fw-bold ${todo.status === STATUS_DONE ? "text-decoration-line-through text-muted" : ""}`}
              style={{ fontSize: "1.15rem", lineHeight: 1.35 }}
            >
              {todo.title}
            </div>
            <div className="small text-muted mt-2 d-flex flex-wrap gap-0 align-items-baseline">
              {[
                Number(todo.estimated_hours || 0) > 0
                  ? `${t.estHours}: ${Number(todo.estimated_hours || 0).toFixed(1)} ${t.hourUnit}`
                  : null,
                Number(todo.estimated_hours || 0) > 0
                  ? `${t.remHours}: ${(
                    (Number(todo.estimated_hours || 0) * (100 - snapProgress(todo.progress_percent))) /
                    100
                  ).toFixed(1)} ${t.hourUnit}`
                  : null,
                todo.ddl ? `${t.dueAt}: ${formatDueWithDays(todo.ddl)}` : null,
                Number(todo.priority || 0) > 0 ? `${t.priority}: ${priorityNote(Number(todo.priority || 0))}` : null,
                todo.label ? `${t.label}: ${todo.label}` : null,
                todo.repeat_rule && todo.repeat_rule !== "none" ? `${t.repeat}: ${repeatRuleNote(todo.repeat_rule)}` : null,
              ]
                .filter(Boolean)
                .map((item, metaIndex) => (
                  <span key={`${todo.id}-meta-${metaIndex}`} className="d-inline-flex align-items-baseline">
                    {metaIndex > 0 ? <span className="px-2">·</span> : null}
                    <span>{item}</span>
                  </span>
                ))}
            </div>
            <div className="mt-2 d-flex align-items-center gap-2 flex-wrap" style={{ maxWidth: "520px", width: "100%" }}>
              <span className="small text-muted" style={{ minWidth: "5.4rem", textAlign: "right" }}>
                {t.progress} {snapProgress(todo.progress_percent)}%
              </span>
              <input
                type="range"
                className="form-range taskease-range flex-grow-1"
                style={{ minWidth: "120px", maxWidth: "280px", marginLeft: "0.25rem" }}
                min={0}
                max={100}
                step={10}
                disabled={todo.status === STATUS_DONE}
                value={snapProgress(todo.progress_percent)}
                onChange={(e) =>
                  updateTodo(todo.id, { progress_percent: Number(e.target.value) })
                }
                aria-label={t.progress}
              />
              {todo.status === STATUS_DONE ? (
                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                  <span className="small text-muted">{t.taskCompletedState}</span>
                  <button
                    type="button"
                    className="btn btn-sm flex-shrink-0"
                    style={{ backgroundColor: themeColors.softBtn, borderColor: themeColors.softBtnBorder, color: "#2b2b2b", fontWeight: 600 }}
                    onClick={() => handleStatusAction(todo, STATUS_PENDING)}
                  >
                    {t.taskReopen}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm flex-shrink-0"
                  style={{ backgroundColor: themeColors.softBtn, borderColor: themeColors.softBtnBorder, color: "#2b2b2b", fontWeight: 600 }}
                  onClick={() => handleStatusAction(todo, STATUS_DONE)}
                >
                  {t.taskComplete}
                </button>
              )}
            </div>
            {todo.remark ? (
              <div className="small text-muted mt-2" style={{ opacity: 0.92 }}>
                {t.remarkPrefix}
                {todo.remark}
              </div>
            ) : null}
          </div>

          <div className="flex-shrink-0 pt-1 d-flex gap-1 ms-auto task-item-actions">
            <button
              className="btn btn-sm"
              style={{ backgroundColor: themeColors.softBtn, borderColor: themeColors.softBtnBorder, color: "#2b2b2b", fontWeight: 600 }}
              type="button"
              title="计时"
              onClick={() => onStartTimer(todo.id)}
            >
              ⏱
            </button>
            <button
              className="btn btn-sm"
              style={{ backgroundColor: themeColors.softBtn, borderColor: themeColors.softBtnBorder, color: "#2b2b2b", fontWeight: 600 }}
              type="button"
              title={t.edit}
              aria-label={t.edit}
              onClick={() => onEditTodo(todo)}
            >
              <i className="bi bi-pencil-square" />
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <section className="card border-0 shadow-sm" style={{ backgroundColor: panelBg }}>
      <div className="card-body p-4 d-grid gap-3">
        <div className="text-center">
          <div className="display-6 fw-semibold">{clock.date} {clock.weekday}</div>
          <div className="display-4 fw-bold mt-1">{clock.time}</div>
          <div className="small text-body-secondary mt-2">
            {t.pendingSummary} {pendingTodos.length} {t.pendingSuffix} {estimateHours} {t.hourUnit}
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="btn-group" role="tablist" aria-label="filters">
            <button className="btn" disabled={isViewTransitioning} style={yellowButtonStyle(filter === "all")} type="button" onClick={() => handleFilterSwitch("all")}>{t.all}</button>
            <button className="btn" disabled={isViewTransitioning} style={yellowButtonStyle(filter === "active")} type="button" onClick={() => handleFilterSwitch("active")}>{t.active}</button>
            <button className="btn" disabled={isViewTransitioning} style={yellowButtonStyle(filter === "done")} type="button" onClick={() => handleFilterSwitch("done")}>{t.done}</button>
          </div>

          <div className="btn-group" role="tablist" aria-label="views">
            <button className="btn" disabled={isViewTransitioning} style={yellowButtonStyle(viewMode === "normal")} type="button" onClick={() => handleViewModeSwitch("normal")}>{t.viewNormal}</button>
            <button className="btn" disabled={isViewTransitioning} style={yellowButtonStyle(viewMode === "due")} type="button" onClick={() => handleViewModeSwitch("due")}>{t.viewByDue}</button>
            <button className="btn" disabled={isViewTransitioning} style={yellowButtonStyle(viewMode === "priority")} type="button" onClick={() => handleViewModeSwitch("priority")}>{t.viewByPriority}</button>
            <button className="btn" disabled={isViewTransitioning} style={yellowButtonStyle(viewMode === "calendar")} type="button" onClick={() => handleViewModeSwitch("calendar")}>{t.viewCalendar}</button>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button className="btn" type="button" style={planBtnStyle} onClick={onOpenPlanWork}>
              <i className="bi bi-calendar-check me-1" /> {t.planWork}
            </button>
            <button className="btn" type="button" style={planBtnStyle} onClick={onAddTask}>
              <i className="bi bi-plus-lg me-1" /> {t.addTask}
            </button>
          </div>
        </div>

        <div className={`p-2 rounded-3 te-view-stage ${viewStageClass}`} style={{ backgroundColor: listBg }}>
          {visibleTodos.length === 0 ? (
            <ul className="list-group">
              <li className="list-group-item text-center" style={{ backgroundColor: listBg }}>
                {pendingTodos.length === 0 ? t.allDone : t.noTask}
              </li>
            </ul>
          ) : null}

          {visibleTodos.length > 0 && viewMode === "normal" ? (
            <ul className="list-group">
              {visibleTodos.map((todo, idx) => renderTaskItem(todo, idx))}
            </ul>
          ) : null}

          {visibleTodos.length > 0 && viewMode === "due" ? (
            <div className="d-flex flex-column flex-lg-row gap-3 align-items-stretch">
              <div className="flex-fill p-2 rounded" style={{ border: `1px dashed ${themeColors.softBtnBorder}` }}>
                <div className="small fw-semibold text-muted mb-2">{t.viewDueNoDdl}</div>
                <ul className="list-group">
                  {sortedNoDue.length === 0 ? (
                    <li className="list-group-item text-center" style={{ backgroundColor: listBg }}>{t.noTask}</li>
                  ) : (
                    sortedNoDue.map((todo, idx) => renderTaskItem(todo, idx))
                  )}
                </ul>
              </div>

              <div className="d-none d-lg-block" style={{ width: "1px", backgroundColor: themeColors.softBtnBorder, opacity: 0.7 }} />

              <div className="flex-fill p-2 rounded" style={{ border: `1px dashed ${themeColors.softBtnBorder}` }}>
                <div className="small fw-semibold text-muted mb-2">{t.viewDueHasDdl}</div>
                <ul className="list-group">
                  {sortedHasDue.length === 0 ? (
                    <li className="list-group-item text-center" style={{ backgroundColor: listBg }}>{t.noTask}</li>
                  ) : (
                    sortedHasDue.map((todo, idx) => renderTaskItem(todo, idx))
                  )}
                </ul>
              </div>
            </div>
          ) : null}

          {visibleTodos.length > 0 && viewMode === "priority" ? (
            <div className="d-grid gap-3">
              {priorityGroups.map((group) => (
                <div
                  key={`priority-${group.level}`}
                  className="p-2 rounded"
                  style={{ border: `2px dashed ${priorityDashColors[group.level] || "#8a8a8a"}` }}
                >
                  <div className="small fw-semibold text-muted mb-2">
                    {t.priority}: {priorityNote(group.level)}
                  </div>
                  <ul className="list-group">
                    {group.todos.map((todo, idx) => renderTaskItem(todo, idx))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}

          {visibleTodos.length > 0 && viewMode === "calendar" ? (
            <div className="d-grid gap-3">
              <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ backgroundColor: themeColors.softBtn, borderColor: themeColors.softBtnBorder, color: "#2b2b2b", fontWeight: 600 }}
                  onClick={() => setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                >
                  {t.calendarPrev}
                </button>
                <div className="fw-semibold">{calendarModel.monthLabel}</div>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ backgroundColor: themeColors.softBtn, borderColor: themeColors.softBtnBorder, color: "#2b2b2b", fontWeight: 600 }}
                  onClick={() => setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                >
                  {t.calendarNext}
                </button>
              </div>

              <div className="taskease-calendar-layout">
                <div className="taskease-calendar-grid-wrap">
                  <div className="taskease-calendar-grid">
                    {(t.calendarWeekdays || ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]).map((label) => (
                      <div key={`weekday-${label}`} className="taskease-calendar-weekday">{label}</div>
                    ))}

                    {calendarModel.cells.map((cell) => (
                      <div
                        key={`cell-${cell.key}`}
                        className={`taskease-calendar-cell ${cell.inCurrentMonth ? "" : "is-muted"} ${selectedDateKey === cell.key ? "is-selected" : ""}`}
                        onClick={() => setSelectedDateKey(cell.key)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleTaskDropToDate(e, cell.key)}
                      >
                        <div className="taskease-calendar-day">{cell.day}</div>
                        <div className="d-grid gap-1 mt-1">
                          {cell.tasks.slice(0, 3).map((todo) => (
                            <button
                              key={`calendar-task-${todo.id}`}
                              type="button"
                              draggable
                              className="taskease-calendar-task"
                              title={todo.title}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTodo(todo);
                              }}
                              onDragStart={(e) => e.dataTransfer.setData("text/task-id", String(todo.id))}
                            >
                              {todo.title}
                            </button>
                          ))}
                          {cell.tasks.length > 3 ? (
                            <div className="taskease-calendar-more">+{cell.tasks.length - 3}</div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <aside className="taskease-calendar-side p-2 rounded" style={{ border: `1px dashed ${themeColors.softBtnBorder}` }}>
                  <div className="small fw-semibold text-muted mb-2">{t.calendarSideTitle}</div>
                  <div className="small mb-2">{selectedDateKey || "-"}</div>
                  <div className="small text-muted mb-2">{t.calendarDragHint}</div>

                  <div className="d-grid gap-2 mb-3">
                    {selectedDateTodos.length === 0 ? (
                      <div className="small text-muted">{t.calendarNoTasks}</div>
                    ) : (
                      selectedDateTodos.map((todo) => (
                        <div key={`selected-${todo.id}`} className="taskease-calendar-side-task" draggable onDragStart={(e) => e.dataTransfer.setData("text/task-id", String(todo.id))}>
                          <div className="fw-semibold text-truncate">{todo.title}</div>
                          <div className="small text-muted">{formatTimeOnly(todo.ddl)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </aside>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
