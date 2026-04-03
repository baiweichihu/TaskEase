import { useEffect, useState } from "react";
import { ModalShell } from "./ModalShell";

export function ProfileSettingsModal({
  isOpen,
  onClose,
  t,
  pageBg,
  themeColors,
  email,
  username,
  onUpdateUsername,
  onResetPassword,
}) {
  const [draftUsername, setDraftUsername] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDraftUsername(username || "");
  }, [isOpen, username]);

  const inputStyle = {
    backgroundColor: themeColors.listBg,
    borderColor: themeColors.softBtnBorder,
    color: "#2b2b2b",
  };

  const actionBtnStyle = {
    backgroundColor: themeColors.softBtn,
    borderColor: themeColors.softBtnBorder,
    color: "#2b2b2b",
  };

  const usernameCount = Array.from(draftUsername || "").length;
  const usernameRemaining = Math.max(0, 15 - usernameCount);

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} backdropZIndex={1060} modalZIndex={1070}>
      {(requestClose) => (
        <div className="modal-dialog" style={{ marginTop: "60px" }}>
          <div className="modal-content" style={{ backgroundColor: pageBg }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title fs-6">{t.profileSettings}</h2>
              <button type="button" className="btn-close" aria-label={t.close} onClick={requestClose} />
            </div>
            <div className="modal-body d-grid gap-3">
              <div className="d-grid gap-2">
                <label className="small" style={{ color: "#2b2b2b", fontWeight: 600 }}>{t.emailBoundLabel || t.email}</label>
                <div className="form-control" style={{ ...inputStyle, opacity: 0.85, cursor: "not-allowed" }} aria-readonly="true">
                  {email || "-"}
                </div>
              </div>

              <div className="d-grid gap-2">
                <label className="small" style={{ color: "#2b2b2b", fontWeight: 600 }}>{t.username}</label>
                <input
                  className="form-control"
                  type="text"
                  maxLength={15}
                  value={draftUsername}
                  onChange={(e) => setDraftUsername(e.target.value)}
                  style={inputStyle}
                />
                <div className="small text-end" style={{ color: "#6b4f2f" }}>
                  {usernameRemaining}/15
                </div>
                <button
                  className="btn"
                  type="button"
                  disabled={isSavingUsername}
                  onClick={async () => {
                    try {
                      setIsSavingUsername(true);
                      await onUpdateUsername(draftUsername);
                    } finally {
                      setIsSavingUsername(false);
                    }
                  }}
                  style={actionBtnStyle}
                >
                  {t.updateUsername}
                  {isSavingUsername ? <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" /> : null}
                </button>
              </div>

              <div className="d-grid gap-2">
                <button
                  className="btn"
                  type="button"
                  onClick={async () => {
                    await onResetPassword();
                  }}
                  style={actionBtnStyle}
                >
                  {t.resetPassword}
                </button>
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
