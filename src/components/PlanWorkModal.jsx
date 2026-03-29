import { useState, useEffect } from "react";
import { computeWorkPlan } from "../planWork";

export function PlanWorkModal({
  isOpen,
  onClose,
  t,
  todos,
  STATUS_DONE,
  pageBg,
}) {
  const [hoursInput, setHoursInput] = useState("");
  const [result, setResult] = useState(null);
  const [algoHintOpen, setAlgoHintOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setHoursInput("");
    setResult(null);
    setAlgoHintOpen(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const customInputStyle = {
    backgroundColor: "#faefdf",
    borderColor: "#e9bd34",
    color: "#2b2b2b",
  };

  function runPlan(e) {
    e.preventDefault();
    const plan = computeWorkPlan(todos, hoursInput, STATUS_DONE);
    setResult(plan);
  }

  return (
    <>
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
            from { transform: translateY(-50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
        <div className="modal-dialog modal-lg" style={{ marginTop: "60px" }}>
          <div className="modal-content" style={{ backgroundColor: pageBg }}>
            <div className="modal-header align-items-center">
              <div className="d-flex align-items-center gap-2 position-relative flex-grow-1 min-w-0">
                <h2 className="modal-title fs-6 mb-0">{t.planWorkTitle}</h2>
                <button
                  type="button"
                  className="btn btn-link p-0 lh-1 border-0"
                  style={{ color: "#0d6efd" }}
                  aria-label={t.planAlgorithmAria}
                  onMouseEnter={() => setAlgoHintOpen(true)}
                  onMouseLeave={() => setAlgoHintOpen(false)}
                  onFocus={() => setAlgoHintOpen(true)}
                  onBlur={() => setAlgoHintOpen(false)}
                >
                  <i className="bi bi-info-circle" />
                </button>
                {algoHintOpen ? (
                  <div
                    className="position-absolute top-100 start-0 mt-1 p-2 rounded shadow border small text-start"
                    style={{
                      zIndex: 10,
                      minWidth: "min(92vw, 380px)",
                      maxWidth: "92vw",
                      backgroundColor: pageBg,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {t.planAlgorithmHint}
                  </div>
                ) : null}
              </div>
              <button type="button" className="btn-close ms-auto" aria-label={t.close} onClick={onClose} />
            </div>
            <div className="modal-body d-grid gap-3">
              <form className="d-flex flex-wrap align-items-end gap-2" onSubmit={runPlan}>
                <div className="flex-grow-1" style={{ minWidth: "200px" }}>
                  <label className="form-label small mb-1 fw-semibold">{t.planAvailableHours}</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.25"
                    min="0"
                    inputMode="decimal"
                    value={hoursInput}
                    onChange={(e) => setHoursInput(e.target.value)}
                    placeholder={t.planHoursPlaceholder}
                    style={customInputStyle}
                  />
                </div>
                <button className="btn btn-warning text-dark" type="submit">
                  {t.planGenerate}
                </button>
              </form>

              {result ? (
                <div className="border rounded-3 p-3" style={{ backgroundColor: "rgba(0,0,0,0.03)" }}>
                  {result.reason === "invalid_hours" ? (
                    <p className="text-danger mb-0 small">{t.planInvalidHours}</p>
                  ) : result.reason === "no_tasks" ? (
                    <p className="text-body-secondary mb-0 small">{t.planNoActiveTasks}</p>
                  ) : (
                    <>
                      <p className="small mb-2">{t.planSummary}</p>
                      {result.suggestions.length === 0 ? (
                        <p className="text-body-secondary small mb-0">{t.planNothingPacked}</p>
                      ) : (
                        <ol className="mb-0 ps-3 small">
                          {result.suggestions.map((s) => (
                            <li key={s.id} className="mb-2">
                              <span className="fw-semibold">{s.title || "—"}</span>
                              <div className="text-body-secondary">
                                {t.planSuggestWork}: <strong>{s.allocateHours.toFixed(2)}</strong>{" "}
                                {t.hourUnit}
                                {" · "}
                                {t.planFullEstimate}: {s.needHours.toFixed(2)} {t.hourUnit}
                                {s.inferred ? ` (${t.planInferredHours})` : ""}
                                {s.ddl ? (
                                  <>
                                    {" · "}
                                    {t.dueAt}: {new Date(s.ddl).toLocaleString()}
                                  </>
                                ) : null}
                                {s.priority > 0 ? (
                                  <>
                                    {" · "}
                                    {t.priority}: {s.priority}
                                  </>
                                ) : null}
                                {s.partial ? (
                                  <span className="text-warning-emphasis"> — {t.planPartial}</span>
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                      {result.unusedHours > 1e-6 && result.suggestions.length > 0 ? (
                        <p className="small mt-2 mb-0 text-body-secondary">
                          {t.planTimeRemaining}: {result.unusedHours.toFixed(2)} {t.hourUnit}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}

              <div className="d-flex justify-content-end">
                <button className="btn btn-outline-secondary" type="button" onClick={onClose}>
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
