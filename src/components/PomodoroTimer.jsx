import { useEffect, useRef, useState } from "react";

export function PomodoroTimer({
  isActive,
  taskData,
  onStop,
  onClose,
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Reset elapsed time when timer is deactivated
  useEffect(() => {
    if (!isActive) {
      setElapsedSeconds(0);
      setIsRunning(false);
      setPosition({ x: 0, y: 0 });
    }
  }, [isActive]);

  useEffect(() => {
    if (taskData?.id) {
      setElapsedSeconds(0);
      setIsRunning(false);
    }
  }, [taskData?.id]);

  // Timer interval
  useEffect(() => {
    if (!isActive || !isRunning) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isRunning]);

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
    setIsRunning(false);
    setElapsedSeconds(0);
    onStop?.();
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
          onClick={onClose}
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
          onClick={() => setIsRunning(!isRunning)}
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
