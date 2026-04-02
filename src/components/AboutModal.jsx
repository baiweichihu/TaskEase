export function AboutModal({
  isOpen,
  onClose,
  t,
  pageBg,
  repoUrl,
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
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1060,
          animation: "fadeIn 0.3s ease-in-out",
        }}
      />

      <div
        className="modal d-block"
        tabIndex="-1"
        style={{
          animation: "slideDown 0.4s ease-out",
          zIndex: 1070,
        }}
      >
        <div className="modal-dialog modal-lg" style={{ marginTop: "60px" }}>
          <div className="modal-content" style={{ backgroundColor: pageBg }}>
            <div className="modal-header">
              <h2 className="modal-title fs-6">{t.aboutUs}</h2>
              <button type="button" className="btn-close" aria-label={t.close} onClick={onClose} />
            </div>
            <div className="modal-body d-grid gap-3">
              <p className="mb-1">{t.aboutSummary}</p>
              <ul className="mb-1 ps-3">
                <li>{t.aboutFeatureAuth}</li>
                <li>{t.aboutFeatureCalendar}</li>
                <li>{t.aboutFeatureRecurring}</li>
                <li>{t.aboutFeatureSync}</li>
                <li>{t.aboutFeatureI18n}</li>
              </ul>
              <div>
                <div className="small text-muted mb-1">{t.aboutRepo}</div>
                <a href={repoUrl} target="_blank" rel="noreferrer">
                  {repoUrl}
                </a>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                {t.close}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
