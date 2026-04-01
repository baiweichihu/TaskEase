import { useMemo, useState, useEffect } from "react";
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
  const [tagSearch, setTagSearch] = useState("");
  const [hintOpen, setHintOpen] = useState(false);
  const [newTagModalOpen, setNewTagModalOpen] = useState(false);
  const [newTagDraft, setNewTagDraft] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setTagSearch("");
      setHintOpen(false);
      setNewTagModalOpen(false);
      setNewTagDraft("");
    }
  }, [isOpen]);

  const filteredLabels = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    const list = Array.isArray(taskLabelOptions) ? taskLabelOptions : [];
    if (!q) return list.slice(0, 20);
    return list.filter((x) => String(x).toLowerCase().includes(q)).slice(0, 20);
  }, [taskLabelOptions, tagSearch]);

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

  function pickLabel(value) {
    setDraft((p) => ({ ...p, label: value }));
    setTagSearch("");
  }

  function submitNewTag() {
    const v = newTagDraft.trim();
    if (!v) return;
    onAddLabelToLibrary(v);
    setNewTagModalOpen(false);
    setNewTagDraft("");
  }

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
                  <input
                    className="form-control flex-grow-1"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder={t.optionalPlaceholder}
                    value={draft.estimated_hours}
                    onChange={(e) => setDraft((p) => ({ ...p, estimated_hours: e.target.value }))}
                    style={{ ...customInputStyle, minWidth: "12rem", maxWidth: "24rem" }}
                  />
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <label className="mb-0 text-nowrap flex-shrink-0" style={labelColStyle}>
                    {t.dueAt}：
                  </label>
                  <input
                    className="form-control flex-grow-1"
                    type="datetime-local"
                    value={draft.ddl}
                    onChange={(e) => setDraft((p) => ({ ...p, ddl: e.target.value }))}
                    style={{ ...customInputStyle, minWidth: "12rem", maxWidth: "28rem" }}
                  />
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

                <div className="d-flex align-items-center gap-1 flex-nowrap" style={{ minWidth: 0 }}>
                  <label className="mb-0 text-nowrap flex-shrink-0 fw-semibold" style={labelColStyle}>
                    {t.label}：
                  </label>
                  <input
                    className="form-control flex-shrink-1"
                    type="text"
                    placeholder={t.tagSearchPlaceholder}
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    style={{ ...customInputStyle, width: "min(140px, 28vw)", minWidth: "72px", maxWidth: "140px" }}
                  />
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
                  {draft.label ? (
                    <span className="badge text-bg-secondary flex-shrink-0 align-self-center">{draft.label}</span>
                  ) : null}
                  {draft.label ? (
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 flex-shrink-0 text-nowrap"
                      onClick={() => setDraft((p) => ({ ...p, label: "" }))}
                    >
                      {t.tagClear}
                    </button>
                  ) : null}
                  <div
                    className="d-flex align-items-center gap-1 flex-nowrap overflow-x-auto flex-grow-1"
                    style={{ minWidth: 0, scrollbarWidth: "thin" }}
                  >
                    {filteredLabels.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className="btn btn-sm flex-shrink-0"
                        style={{ backgroundColor: themeColors.softBtn, borderColor: themeColors.softBtnBorder, color: "#2b2b2b", fontSize: "0.8rem" }}
                        onClick={() => pickLabel(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2 flex-wrap">
                  <label className="mb-0 text-nowrap flex-shrink-0 pt-2" style={labelColStyle}>
                    {t.remark}：
                  </label>
                  <textarea
                    className="form-control flex-grow-1"
                    rows={3}
                    placeholder={t.optionalPlaceholder}
                    value={draft.remark}
                    onChange={(e) => setDraft((p) => ({ ...p, remark: e.target.value }))}
                    style={{ ...customInputStyle, minWidth: "12rem" }}
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
