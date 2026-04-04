import { useMemo } from "react";
import { ModalShell } from "./ModalShell";

export function DataStatsModal({
  isOpen,
  onClose,
  t,
  pageBg,
  themeColors,
  todos,
  STATUS_DONE,
}) {
  // 计算所有已完成任务的统计
  const allCompleted = useMemo(() => {
    const completed = todos.filter((todo) => todo.status === STATUS_DONE);
    const totalTasks = completed.length;
    const estimatedHours = completed.reduce((sum, todo) => sum + Number(todo.estimated_hours || 0), 0);
    const pomodoroHours = completed.reduce((sum, todo) => sum + Number(todo.pomodoro_total_seconds || 0), 0) / 3600;
    return { totalTasks, estimatedHours: estimatedHours.toFixed(1), pomodoroHours: pomodoroHours.toFixed(1) };
  }, [todos, STATUS_DONE]);

  // 计算最近一周完成任务的统计
  const weekCompleted = useMemo(() => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const completed = todos.filter((todo) => {
      if (todo.status !== STATUS_DONE) return false;
      const completedAt = new Date(todo.updated_at || todo.created_at || "");
      if (!Number.isFinite(completedAt.getTime())) return false;
      return completedAt >= oneWeekAgo;
    });
    const totalTasks = completed.length;
    const estimatedHours = completed.reduce((sum, todo) => sum + Number(todo.estimated_hours || 0), 0);
    const pomodoroHours = completed.reduce((sum, todo) => sum + Number(todo.pomodoro_total_seconds || 0), 0) / 3600;
    return { totalTasks, estimatedHours: estimatedHours.toFixed(1), pomodoroHours: pomodoroHours.toFixed(1) };
  }, [todos, STATUS_DONE]);

  const statBoxStyle = {
    backgroundColor: themeColors.listBg,
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "12px",
    border: `1px solid ${themeColors.softBtnBorder}`,
  };

  const statLabelStyle = {
    color: "#2b2b2b",
    fontSize: "0.875rem",
    fontWeight: 600,
    marginBottom: "8px",
  };

  const statValueStyle = {
    color: "#2b2b2b",
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: "4px",
  };

  const statDetailStyle = {
    color: "#666666",
    fontSize: "0.875rem",
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} backdropZIndex={1060} modalZIndex={1070} closeOnBackdrop>
      {(requestClose) => (
        <div className="modal-dialog" style={{ marginTop: "60px" }}>
          <div className="modal-content" style={{ backgroundColor: pageBg }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title fs-6">{t.dataStatsTitle}</h2>
              <button type="button" className="btn-close" aria-label={t.close} onClick={requestClose} />
            </div>
            <div className="modal-body d-grid gap-3">
              {/* 累计统计 */}
              <div style={statBoxStyle}>
                <div style={statLabelStyle}>📊 {t.allTimeStats}</div>
                <div style={statValueStyle}>{allCompleted.totalTasks}</div>
                <div style={statDetailStyle}>
                  {t.completedTasks}: {allCompleted.totalTasks}
                </div>
                <div style={statDetailStyle}>
                  {t.estimatedHoursStat || t.totalHours}: {allCompleted.estimatedHours}h
                </div>
                <div style={statDetailStyle}>
                  {t.pomodoroHoursStat || "Pomodoro"}: {allCompleted.pomodoroHours}h
                </div>
              </div>

              {/* 最近一周统计 */}
              <div style={statBoxStyle}>
                <div style={statLabelStyle}>📈 {t.weekStats}</div>
                <div style={statValueStyle}>{weekCompleted.totalTasks}</div>
                <div style={statDetailStyle}>
                  {t.completedTasks}: {weekCompleted.totalTasks}
                </div>
                <div style={statDetailStyle}>
                  {t.estimatedHoursStat || t.totalHours}: {weekCompleted.estimatedHours}h
                </div>
                <div style={statDetailStyle}>
                  {t.pomodoroHoursStat || "Pomodoro"}: {weekCompleted.pomodoroHours}h
                </div>
              </div>

              {/* 统计说明 */}
              <div style={{ fontSize: "0.75rem", color: "#999999", marginTop: "8px", padding: "8px", backgroundColor: "rgba(0,0,0,0.05)", borderRadius: "4px" }}>
                {t.statsDescription}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={requestClose}>
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
