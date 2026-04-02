import { useState, useEffect } from "react";
import { InputModal } from "./InputModal";

export function AddTaskModal({
  isOpen,
  onClose,
  t,
  draft,
  setDraft,
  onSubmit,
  onSubmitProbe,
  isSubmitting = false,
  pageBg,
  themeColors,
  isEditing,
  taskLabelOptions,
  onAddLabelToLibrary,
  onRequestDelete,
}) {
  const [hintOpen, setHintOpen] = useState(false);
  const [dueHintOpen, setDueHintOpen] = useState(false);
  const [newTagModalOpen, setNewTagModalOpen] = useState(false);
  const [newTagDraft, setNewTagDraft] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setHintOpen(false);
      setDueHintOpen(false);
      setNewTagModalOpen(false);
      setNewTagDraft("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const customInputStyle = {
    backgroundColor: themeColors.listBg,
    borderColor: themeColors.softBtnBorder,
    color: "#2b2b2b",
  };

  const priorityOptions = [
    { value: "0", label: t.priorityOpt0 },
    { value: "1", label: t.priorityOpt1 },
    { value: "2", label: t.priorityOpt2 },
    { value: "3", label: t.priorityOpt3 },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
    { value: "7", label: "7" },
    { value: "8", label: "8" },
    { value: "9", label: "9" },
    { value: "10", label: "10" },
  ];

  function submitNewTag() {
    const v = newTagDraft.trim();
    if (!v) return;
    onAddLabelToLibrary(v);
    setNewTagModalOpen(false);
    setNewTagDraft("");
  }

  function normalizeDate(value) {
    const v = String(value || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "";
    const d = new Date(`${v}T00:00:00`);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function addDays(dateKey, days) {
    const base = normalizeDate(dateKey);
    if (!base) return "";
    const d = new Date(`${base}T00:00:00`);
    d.setDate(d.getDate() + days);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  const todayKey = normalizeDate(new Date().toISOString().slice(0, 10));
  const repeatStartDate = normalizeDate(draft.ddlDate) || todayKey;
  const repeatUntilMaxDate = addDays(repeatStartDate, 365);

  const labelColStyle = { minWidth: "7.5rem", fontWeight: 600 };

  return (
    <>
      <InputModal
        isOpen={newTagModalOpen}
        onClose={() => {
          setNewTagModalOpen(false);
          setNewTagDraft("");
        }}
        title={t.tagModalTitle}
        value={newTagDraft}
        onChange={setNewTagDraft}
        onSubmit={submitNewTag}
        placeholder={t.newTagPrompt}
        submitLabel={t.tagModalConfirm}
        cancelLabel={t.cancel}
        closeAriaLabel={t.close}
        pageBg={pageBg}
      />

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
        <div className="modal-dialog modal-lg" style={{ marginTop: "60px" }}>
          <div className="modal-content" style={{ backgroundColor: pageBg }}>
            <div className="modal-header">
              <h2 className="modal-title fs-6">{isEditing ? t.editTask : t.addTask}</h2>
              <button type="button" className="btn-close" aria-label={t.close} onClick={onClose} />
            </div>
            <div className="modal-body">
              <form
                className="d-grid gap-3"
                onSubmit={(e) => {
                  onSubmitProbe?.("form_submit_fired");
                  onSubmit(e);
                }}
              >
                <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ minWidth: 0 }}>
                  <div className="d-flex align-items-center gap-1 flex-shrink-0 position-relative" style={labelColStyle}>
                    <label className="mb-0 text-nowrap fw-semibold">{t.addFieldTitle}：</label>
                    <button
                      type="button"
                      className="btn btn-link p-0 lh-1 border-0"
                      style={{ color: "#0d6efd" }}
                      aria-label={t.addTaskHintTitle}
                      onMouseEnter={() => setHintOpen(true)}
                      onMouseLeave={() => setHintOpen(false)}
                      onFocus={() => setHintOpen(true)}
                      onBlur={() => setHintOpen(false)}
                    >
                      <i className="bi bi-info-circle" />
                    </button>
                    {hintOpen ? (
                      <div
                        className="position-absolute top-100 start-0 mt-1 p-2 rounded shadow border small text-start"
                        style={{
                          zIndex: 1090,
                          minWidth: "min(92vw, 320px)",
                          maxWidth: "92vw",
                          backgroundColor: pageBg,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {t.addTaskHint}
                      </div>
                    ) : null}
                  </div>

                  <input
                    className="form-control flex-grow-1"
                    type="text"
                    placeholder={t.titlePlaceholder}
                    value={draft.title}
                    onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                    style={{ ...customInputStyle, minWidth: 0 }}
                    required
                  />
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <label className="mb-0 text-nowrap flex-shrink-0" style={labelColStyle}>
                    {t.estHours}：
                  </label>
                  <div className="input-group flex-grow-1" style={{ minWidth: "10rem", maxWidth: "12rem" }}>
                    <input
                      className="form-control"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder={t.optionalPlaceholder}
                      value={draft.estimated_hours}
                      onChange={(e) => setDraft((p) => ({ ...p, estimated_hours: e.target.value }))}
                      style={customInputStyle}
                    />
                    <span className="input-group-text" style={{ ...customInputStyle, fontWeight: 600 }}>
                      {t.hourUnit}
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <label className="mb-0 text-nowrap flex-shrink-0 d-flex align-items-center gap-1 position-relative" style={labelColStyle}>
                    {t.dueAt}：
                    <button
                      type="button"
                      className="btn btn-link p-0 lh-1 border-0"
                      style={{ color: "#0d6efd" }}
                      aria-label={t.dueTimeDefaultHint}
                      onMouseEnter={() => setDueHintOpen(true)}
                      onMouseLeave={() => setDueHintOpen(false)}
                      onFocus={() => setDueHintOpen(true)}
                      onBlur={() => setDueHintOpen(false)}
                    >
                      <i className="bi bi-info-circle" />
                    </button>
                    {dueHintOpen ? (
                      <div
                        className="position-absolute top-100 start-0 mt-1 p-2 rounded shadow border small text-start"
                        style={{
                          zIndex: 1090,
                          minWidth: "min(92vw, 300px)",
                          maxWidth: "92vw",
                          backgroundColor: pageBg,
                        }}
                      >
                        {t.dueTimeDefaultHint}
                      </div>
                    ) : null}
                  </label>
                  <div className="d-flex align-items-center gap-2 flex-grow-1 flex-wrap" style={{ minWidth: "12rem" }}>
                    <input
                      className="form-control"
                      type="date"
                      value={draft.ddlDate}
                      onChange={(e) => setDraft((p) => ({ ...p, ddlDate: e.target.value }))}
                      style={{ ...customInputStyle, minWidth: "11rem", maxWidth: "16rem" }}
                    />
                    <input
                      className="form-control"
                      type="time"
                      step="60"
                      value={draft.ddlTime}
                      placeholder={t.optionalPlaceholder}
                      onChange={(e) => setDraft((p) => ({ ...p, ddlTime: e.target.value }))}
                      style={{ ...customInputStyle, minWidth: "8rem", maxWidth: "10rem" }}
                    />
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <label className="mb-0 text-nowrap flex-shrink-0" style={labelColStyle}>
                    {t.priority}：
                  </label>
                  <select
                    className="form-control flex-grow-1"
                    value={draft.priority}
                    onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value }))}
                    style={{ ...customInputStyle, minWidth: "12rem", maxWidth: "24rem" }}
                  >
                    <option value="">{t.optionalPlaceholder}</option>
                    {priorityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <label className="mb-0 text-nowrap flex-shrink-0" style={labelColStyle}>
                    {t.repeat}：
                  </label>
                  <select
                    className="form-control flex-grow-1"
                    value={draft.repeat_rule || "none"}
                    onChange={(e) => {
                      const nextRule = e.target.value;
                      setDraft((p) => ({
                        ...p,
                        repeat_rule: nextRule,
                        repeat_until_date: nextRule === "none" ? "" : p.repeat_until_date,
                      }));
                    }}
                    style={{ ...customInputStyle, minWidth: "12rem", maxWidth: "24rem" }}
                  >
                    <option value="none">{t.repeatNone}</option>
                    <option value="daily">{t.repeatDaily}</option>
                    <option value="weekly">{t.repeatWeekly}</option>
                    <option value="monthly">{t.repeatMonthly}</option>
                  </select>
                </div>

                {draft.repeat_rule && draft.repeat_rule !== "none" ? (
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <label className="mb-0 text-nowrap flex-shrink-0" style={labelColStyle}>
                      {t.repeatUntilDate}：
                    </label>
                    <input
                      className="form-control flex-grow-1"
                      type="date"
                      value={draft.repeat_until_date || ""}
                      min={repeatStartDate || undefined}
                      max={repeatUntilMaxDate || undefined}
                      onChange={(e) => setDraft((p) => ({ ...p, repeat_until_date: e.target.value }))}
                      style={{ ...customInputStyle, minWidth: "12rem", maxWidth: "24rem" }}
                    />
                    <div className="small text-muted w-100" style={{ marginLeft: "calc(7.5rem + 0.5rem)" }}>
                      {t.repeatUntilHint}
                    </div>
                  </div>
                ) : null}

                <div className="d-flex align-items-center gap-1 flex-nowrap" style={{ minWidth: 0 }}>
                  <label className="mb-0 text-nowrap flex-shrink-0 fw-semibold" style={labelColStyle}>
                    {t.label}：
                  </label>
                  <select
                    className="form-control flex-grow-1"
                    value={draft.label}
                    onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))}
                    style={{ ...customInputStyle, minWidth: "12rem", maxWidth: "24rem" }}
                  >
                    <option value="">{t.tagNone}</option>
                    {(Array.isArray(taskLabelOptions) ? taskLabelOptions : []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary text-nowrap flex-shrink-0 px-2"
                    onClick={() => {
                      setNewTagDraft("");
                      setNewTagModalOpen(true);
                    }}
                  >
                    {t.tagAddNew}
                  </button>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <label className="mb-0 text-nowrap flex-shrink-0" style={labelColStyle}>
                    {t.remark}：
                  </label>
                  <input
                    className="form-control flex-grow-1"
                    type="text"
                    placeholder={t.optionalPlaceholder}
                    value={draft.remark}
                    onChange={(e) => setDraft((p) => ({ ...p, remark: e.target.value }))}
                    style={{ ...customInputStyle, minWidth: "12rem", maxWidth: "36rem" }}
                  />
                </div>

                <div className="d-flex flex-wrap align-items-center gap-2 pt-2 justify-content-end">
                  {isEditing && onRequestDelete ? (
                    <button type="button" className="btn btn-outline-danger me-auto" onClick={onRequestDelete}>
                      {t.deleteTask}
                    </button>
                  ) : null}
                  <button className="btn btn-outline-secondary" type="button" onClick={onClose}>
                    {t.cancel}
                  </button>
                  <button
                    className="btn text-dark"
                    type="submit"
                    disabled={isSubmitting}
                    onClick={() => onSubmitProbe?.("submit_button_clicked")}
                    style={{ backgroundColor: themeColors.softBtn, borderColor: themeColors.softBtnBorder }}
                  >
                    {isSubmitting ? t.submitting : isEditing ? t.saveChanges : t.addTaskSubmit}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
