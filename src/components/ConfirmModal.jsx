/**
 * Custom confirm dialog (no window.confirm).
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  closeAriaLabel,
  pageBg,
  danger,
}) {
  if (!isOpen) return null;

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
          zIndex: 1070,
          animation: "fadeIn 0.25s ease-in-out",
        }}
        onClick={onClose}
      />
      <div
        className="modal d-block"
        tabIndex="-1"
        style={{ zIndex: 1071 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "420px" }}>
          <div
            className="modal-content shadow"
            style={{ backgroundColor: pageBg }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header py-2">
              <h2 id="confirm-modal-title" className="modal-title fs-6 mb-0">
                {title}
              </h2>
              <button type="button" className="btn-close" aria-label={closeAriaLabel} onClick={onClose} />
            </div>
            <div className="modal-body py-3">
              <p className="mb-0 small" style={{ whiteSpace: "pre-wrap" }}>
                {message}
              </p>
            </div>
            <div className="modal-footer py-2 gap-2 flex-wrap justify-content-end">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                {cancelLabel}
              </button>
              <button
                type="button"
                className={danger ? "btn btn-danger" : "btn btn-warning text-dark"}
                onClick={() => onConfirm?.()}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
