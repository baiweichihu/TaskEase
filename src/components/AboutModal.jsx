import { ModalShell } from "./ModalShell";

export function AboutModal({
  isOpen,
  onClose,
  t,
  pageBg,
  repoUrl,
}) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} backdropZIndex={1060} modalZIndex={1070}>
      {(requestClose) => (
        <div className="modal-dialog modal-lg" style={{ marginTop: "60px" }}>
          <div className="modal-content" style={{ backgroundColor: pageBg }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title fs-6">{t.aboutUs}</h2>
              <button type="button" className="btn-close" aria-label={t.close} onClick={requestClose} />
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
