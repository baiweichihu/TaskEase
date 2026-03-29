/**
 * Small overlay modal with a single text input (OTP-style layout).
 * Reusable for one-line prompts (e.g. new tag name).
 */
export function InputModal({
  isOpen,
  onClose,
  title,
  value,
  onChange,
  onSubmit,
  placeholder,
  submitLabel,
  cancelLabel,
  closeAriaLabel,
  pageBg,
  inputStyle,
}) {
  if (!isOpen) return null;

  const baseInputStyle = {
    backgroundColor: "#faefdf",
    borderColor: "#e9bd34",
    color: "#2b2b2b",
    ...inputStyle,
  };

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit?.();
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
          backgroundColor: "rgba(0, 0, 0, 0.45)",
          zIndex: 1060,
          animation: "fadeIn 0.25s ease-in-out",
        }}
        onClick={onClose}
      />
      <div
        className="modal d-block"
        tabIndex="-1"
        style={{ zIndex: 1061 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="input-modal-title"
      >
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "400px" }}>
          <div
            className="modal-content shadow"
            style={{ backgroundColor: pageBg }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header py-2">
              <h2 id="input-modal-title" className="modal-title fs-6 mb-0">
                {title}
              </h2>
              <button type="button" className="btn-close" aria-label={closeAriaLabel} onClick={onClose} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body pt-0">
                <input
                  className="form-control"
                  type="text"
                  value={value}
                  onChange={(e) => onChange?.(e.target.value)}
                  placeholder={placeholder}
                  style={baseInputStyle}
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <div className="modal-footer py-2 gap-2 flex-wrap">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  {cancelLabel}
                </button>
                <button type="submit" className="btn btn-warning text-dark">
                  {submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
