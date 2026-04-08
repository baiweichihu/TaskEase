import { useCallback, useEffect, useRef, useState } from "react";

export function PomodoroTimer({
  isActive,
  taskData,
  onSessionChange,
  onPersistSession,
  onStop,
  maxSeconds = 5 * 3600,
}) {
  const [committedSeconds, setCommittedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [sessionVersion, setSessionVersion] = useState(0);
  const runningSinceRef = useRef(null);
  const initialCommittedRef = useRef(0);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isActive) return;
    runningSinceRef.current = null;
    initialCommittedRef.current = 0;
    setCommittedSeconds(0);
    setIsRunning(false);
    setNowTs(Date.now());
    setPosition({ x: 0, y: 0 });
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !taskData?.id) return;
    runningSinceRef.current = null;
    const baseSeconds = Math.max(0, Number(taskData.pomodoro_total_seconds || 0));
    initialCommittedRef.current = baseSeconds;
    setCommittedSeconds(baseSeconds);
    setIsRunning(false);
    setNowTs(Date.now());
    setSessionVersion((prev) => prev + 1);
  }, [isActive, taskData?.id, taskData?.pomodoro_total_seconds]);

  useEffect(() => {
    if (!isRunning) return;

    function refreshNow() {
      setNowTs(Date.now());
    }

    refreshNow();
    const intervalId = window.setInterval(refreshNow, 1000);
    window.addEventListener("focus", refreshNow);
    document.addEventListener("visibilitychange", refreshNow);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshNow);
      document.removeEventListener("visibilitychange", refreshNow);
    }
  }, [isRunning, sessionVersion]);

  const runningSeconds = isRunning && runningSinceRef.current
    ? Math.max(0, Math.floor((nowTs - runningSinceRef.current) / 1000))
    : 0;
  const elapsedSeconds = Math.min(maxSeconds, committedSeconds + runningSeconds);

  const getProgressPercent = useCallback((totalSeconds) => {
    const estimatedHours = Number(taskData?.estimated_hours || 0);
    if (estimatedHours <= 0) return Number(taskData?.progress_percent || 0);
    const percent = (Math.max(0, Number(totalSeconds || 0)) / (estimatedHours * 3600)) * 100;
    return Math.max(0, Math.min(100, percent));
  }, [taskData?.estimated_hours, taskData?.progress_percent]);

  const commitSession = useCallback((nextSeconds, { closeTimer = false, resetTimer = false, stopReason = "manual" } = {}) => {
    if (!taskData?.id) return;
    const committed = Math.max(0, Math.floor(Number(nextSeconds || 0)));
    const startedAt = isRunning ? runningSinceRef.current : null;
    const endedAt = Date.now();
    const currentSegmentSeconds = isRunning
      ? Math.max(0, Math.floor((endedAt - Number(startedAt || endedAt)) / 1000))
      : 0;
    const accumulatedSessionSeconds = Math.max(0, committed - Math.max(0, Number(initialCommittedRef.current || 0)));
    const sessionSeconds = closeTimer ? accumulatedSessionSeconds : currentSegmentSeconds;
    const startedAtForStop = closeTimer ? null : startedAt;
    setCommittedSeconds(committed);
    setIsRunning(false);
    runningSinceRef.current = null;
    setNowTs(Date.now());
    onPersistSession?.({
      taskId: taskData.id,
      totalSeconds: committed,
      progressPercent: getProgressPercent(committed),
    });
    if (resetTimer) {
      setCommittedSeconds(0);
    }
    if (closeTimer) {
      onStop?.({
        taskId: taskData.id,
        totalSeconds: committed,
        progressPercent: getProgressPercent(committed),
        reason: stopReason,
        startedAt: startedAtForStop,
        endedAt,
        sessionSeconds,
      });
    }
  }, [getProgressPercent, isRunning, onPersistSession, onStop, taskData?.id]);

  useEffect(() => {
    if (!isActive || !taskData?.id) return;
    onSessionChange?.({
      taskId: taskData.id,
      committedSeconds,
      displaySeconds: elapsedSeconds,
      isRunning,
      startedAt: runningSinceRef.current,
    });
  }, [isActive, taskData?.id, committedSeconds, elapsedSeconds, isRunning, onSessionChange]);

  useEffect(() => {
    if (!isDragging) return;

    function handleMove(event) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const nextX = event.clientX - dragOffsetRef.current.x;
      const nextY = event.clientY - dragOffsetRef.current.y;
      const constrainedX = Math.max(0, Math.min(vw - 320, nextX));
      const constrainedY = Math.max(0, Math.min(vh - 100, nextY));
      setPosition({ x: constrainedX, y: constrainedY });
    }

    function handleUp() {
      setIsDragging(false);
    }

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!isActive || !taskData?.id || !isRunning) return;
    if (elapsedSeconds < maxSeconds) return;
    commitSession(maxSeconds, { closeTimer: true, resetTimer: false, stopReason: "limit_reached" });
  }, [isActive, taskData?.id, isRunning, elapsedSeconds, maxSeconds, commitSession]);

  if (!isActive || !taskData) return null;

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Format task info
  const taskInfo = [];
  if (taskData.title) taskInfo.push(`标题: ${taskData.title}`);
  if (taskData.description) taskInfo.push(`描述: ${taskData.description}`);
  if (taskData.estimated_hours && taskData.estimated_hours > 0) {
    taskInfo.push(`预计: ${taskData.estimated_hours}h`);
  }
  if (taskData.priority && taskData.priority > 0) {
    const priorityMap = { 1: "最优先", 2: "次优先", 3: "不是很优先" };
    taskInfo.push(`优先级: ${priorityMap[taskData.priority] || taskData.priority}`);
  }
  if (taskData.ddl) taskInfo.push(`截止: ${taskData.ddl}`);

  function startDrag(event) {
    const timerRect = event.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - timerRect.left,
      y: event.clientY - timerRect.top,
    };
    setIsDragging(true);
  }

  function handleStop() {
    const nextSeconds = isRunning && runningSinceRef.current
      ? committedSeconds + Math.max(0, Math.floor((Date.now() - runningSinceRef.current) / 1000))
      : committedSeconds;
    commitSession(nextSeconds, { closeTimer: true, resetTimer: true, stopReason: "manual" });
  }

  function handleToggleRunning() {
    if (isRunning) {
      const nextSeconds = committedSeconds + Math.max(0, Math.floor((Date.now() - (runningSinceRef.current || Date.now())) / 1000));
      commitSession(nextSeconds, { closeTimer: false, resetTimer: false });
      return;
    }

    if (committedSeconds >= maxSeconds) {
      commitSession(maxSeconds, { closeTimer: true, resetTimer: false, stopReason: "limit_reached" });
      return;
    }

    runningSinceRef.current = Date.now();
    setIsRunning(true);
    setNowTs(Date.now());
    setSessionVersion((prev) => prev + 1);
  }

  return (
    <div
      className="position-fixed"
      style={{
        bottom: position.y === 0 ? "20px" : "auto",
        right: position.x === 0 ? "20px" : "auto",
        left: position.x === 0 ? "auto" : `${position.x}px`,
        top: position.y === 0 ? "auto" : `${position.y}px`,
        backgroundColor: "#1a1a1a",
        border: "1px solid #444",
        borderRadius: "4px",
        padding: "10px",
        minWidth: "280px",
        maxWidth: "320px",
        zIndex: 9999,
        fontFamily: "monospace",
        color: "#2a8f4a",
        fontSize: "0.875rem",
        lineHeight: "1.4",
      }}
    >
      <div
        className="d-flex align-items-center justify-content-between mb-2 text-nowrap"
        onMouseDown={startDrag}
        style={{
          cursor: "move",
          padding: "4px 6px",
          borderBottom: "1px solid #555",
          userSelect: "none",
        }}
      >
        <div style={{ fontSize: "0.85rem", fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
          {taskData?.title || "计时"}
        </div>
        <button
          type="button"
          onClick={handleStop}
          style={{
            border: "none",
            background: "transparent",
            color: "#ffffff",
            cursor: "pointer",
            padding: 0,
            fontSize: "0.9rem",
            lineHeight: 1,
            marginLeft: "8px",
          }}
          title="close"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>

      {/* Timer Display */}
      <div
        style={{
          fontSize: "1.8rem",
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: "10px",
          letterSpacing: "2px",
          fontFamily: "Courier New, monospace",
        }}
      >
        {formatTime(elapsedSeconds)}
      </div>

      {/* Task Info */}
      <div style={{ fontSize: "0.7rem", marginBottom: "10px", opacity: 0.85 }}>
        {taskInfo.slice(1).map((info, idx) => (
          <div key={idx}>{info}</div>
        ))}
      </div>

      {/* Button Controls */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={handleToggleRunning}
          style={{
            backgroundColor: "transparent",
            color: "#ffffff",
            border: "none",
            width: "40px",
            height: "40px",
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "1.2rem",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <i className={isRunning ? "bi bi-pause-fill" : "bi bi-play-fill"} />
        </button>
        <button
          type="button"
          onClick={handleStop}
          style={{
            backgroundColor: "transparent",
            color: "#ff6b6b",
            border: "none",
            width: "40px",
            height: "40px",
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "1.2rem",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <i className="bi bi-stop-fill" />
        </button>
      </div>
    </div>
  );
}
