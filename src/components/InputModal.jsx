/**
 * Small overlay modal with a single text input (OTP-style layout).
 * Reusable for one-line prompts (e.g. new tag name).
 */
import { ModalShell } from "./ModalShell";

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
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      backdropZIndex={1060}
      modalZIndex={1061}
      closeOnBackdrop
      role="dialog"
      ariaModal="true"
      ariaLabelledby="input-modal-title"
    >
      {(requestClose) => (
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
              <button type="button" className="btn-close" aria-label={closeAriaLabel} onClick={requestClose} />
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
                <button type="button" className="btn btn-outline-secondary" onClick={requestClose}>
                  {cancelLabel}
                </button>
                <button type="submit" className="btn btn-warning text-dark">
                  {submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
