export function TaskManager({
  t,
  clock,
  pendingTodos,
  estimateHours,
  filter,
  setFilter,
  batchMode,
  setBatchMode,
  selectedIds,
  visibleTodos,
  onAddTask,
  onOpenPlanWork,
  onBatchSelect,
  onBatchDone,
  onBatchDelete,
  panelBg,
  listBg,
  themeColors,
  STATUS_DONE,
  STATUS_PENDING,
  updateTodo,
  handleDelete,
  onEditTodo,
  snapProgress,
  onStartTimer,
}) {
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
            <button className="btn" style={yellowButtonStyle(filter === "all")} type="button" onClick={() => setFilter("all")}>{t.all}</button>
            <button className="btn" style={yellowButtonStyle(filter === "active")} type="button" onClick={() => setFilter("active")}>{t.active}</button>
            <button className="btn" style={yellowButtonStyle(filter === "done")} type="button" onClick={() => setFilter("done")}>{t.done}</button>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button className="btn" type="button" style={planBtnStyle} onClick={onOpenPlanWork}>
              <i className="bi bi-calendar-check me-1" /> {t.planWork}
            </button>
            <button className="btn" type="button" style={planBtnStyle} onClick={onAddTask}>
              <i className="bi bi-plus-lg me-1" /> {t.addTask}
            </button>
            <button className="btn" type="button" style={planBtnStyle} onClick={() => {
              setBatchMode((v) => !v);
            }}>
              <i className="bi bi-check2-square me-1" /> {t.batchSelect}
            </button>
          </div>
        </div>

        {batchMode ? (
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-warning text-dark" type="button" onClick={onBatchDone}>{t.markDone}</button>
            <button className="btn btn-danger" type="button" onClick={onBatchDelete}>{t.deleteSelected}</button>
            <button className="btn btn-outline-secondary" type="button" onClick={() => {
              setBatchMode(false);
            }}>{t.exitBatch}</button>
          </div>
        ) : null}

        <div className="p-2 rounded-3" style={{ backgroundColor: listBg }}>
          <ul className="list-group">
            {visibleTodos.length === 0 ? (
              <li className="list-group-item text-center" style={{ backgroundColor: listBg }}>
                {pendingTodos.length === 0 ? t.allDone : t.noTask}
              </li>
            ) : null}

            {visibleTodos.map((todo, idx) => (
              <li key={todo.id} className="list-group-item border-0 border-bottom" style={{ backgroundColor: listBg }}>
                <div className="d-flex gap-2 align-items-start">
                  <div className="d-flex align-items-start gap-1 flex-shrink-0 pt-1">
                    <span
                      className="fw-bold text-body-secondary"
                      style={{ fontSize: "1.35rem", minWidth: "2.5rem", fontFamily: "Manrope, Noto Sans SC, sans-serif" }}
                    >
                      {idx + 1}
                    </span>
                    {batchMode ? (
                      <input
                        className="form-check-input mt-2"
                        type="checkbox"
                        checked={selectedIds.has(todo.id)}
                        onChange={(e) => {
                          const next = new Set(selectedIds);
                          if (e.target.checked) next.add(todo.id);
                          else next.delete(todo.id);
                          onBatchSelect(next);
                        }}
                        aria-label={t.batchSelect}
                      />
                    ) : null}
                  </div>

                  <div className="flex-grow-1 min-w-0">
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
                        todo.ddl ? `${t.dueAt}: ${new Date(todo.ddl).toLocaleString()}` : null,
                        Number(todo.priority || 0) > 0 ? `${t.priority}: ${priorityNote(Number(todo.priority || 0))}` : null,
                        todo.label ? `${t.label}: ${todo.label}` : null,
                      ]
                        .filter(Boolean)
                        .map((item, metaIndex) => (
                          <span key={`${todo.id}-meta-${metaIndex}`} className="d-inline-flex align-items-baseline">
                            {metaIndex > 0 ? <span className="px-2">·</span> : null}
                            <span>{item}</span>
                          </span>
                        ))}
                    </div>
                    <div className="mt-2 d-flex align-items-center gap-2 flex-nowrap" style={{ maxWidth: "520px", width: "100%" }}>
                      <span className="small text-muted text-nowrap" style={{ width: "5.4rem", textAlign: "right" }}>
                        {t.progress} {snapProgress(todo.progress_percent)}%
                      </span>
                      <input
                        type="range"
                        className="form-range taskease-range flex-grow-1"
                        style={{ minWidth: "100px", maxWidth: "280px", marginLeft: "0.25rem" }}
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
                            onClick={() =>
                              updateTodo(todo.id, {
                                status: STATUS_PENDING,
                                progress_percent: snapProgress(todo.progress_percent) >= 100 ? 90 : snapProgress(todo.progress_percent),
                              })
                            }
                          >
                            {t.taskReopen}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm flex-shrink-0"
                          style={{ backgroundColor: themeColors.softBtn, borderColor: themeColors.softBtnBorder, color: "#2b2b2b", fontWeight: 600 }}
                          onClick={() =>
                            updateTodo(todo.id, { status: STATUS_DONE, progress_percent: 100 })
                          }
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

                  <div className="flex-shrink-0 pt-1 d-flex gap-1">
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
                      onClick={() => onEditTodo(todo)}
                    >
                      {t.edit}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
