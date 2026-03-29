import { useEffect, useState } from "react";

export function ProfileSettingsModal({
  isOpen,
  onClose,
  t,
  pageBg,
  username,
  email,
  onUpdateEmail,
  onUpdateUsername,
  onResetPassword,
}) {
  const [draftEmail, setDraftEmail] = useState("");
  const [draftUsername, setDraftUsername] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDraftEmail(email || "");
    setDraftUsername(username || "");
  }, [isOpen, email, username]);

  if (!isOpen) return null;

  const inputStyle = {
    backgroundColor: "#faefdf",
    borderColor: "#e9bd34",
    color: "#2b2b2b",
  };

  const usernameCount = Array.from(draftUsername || "").length;
  const usernameRemaining = Math.max(0, 15 - usernameCount);

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
        <div className="modal-dialog" style={{ marginTop: "60px" }}>
          <div className="modal-content" style={{ backgroundColor: pageBg }}>
            <div className="modal-header">
              <h2 className="modal-title fs-6">{t.profileSettings}</h2>
              <button type="button" className="btn-close" aria-label={t.close} onClick={onClose} />
            </div>
            <div className="modal-body d-grid gap-3">
              <div className="d-grid gap-2">
                <label className="small" style={{ color: "#2b2b2b", fontWeight: 600 }}>{t.email}</label>
                <input
                  className="form-control"
                  type="text"
                  value={draftEmail}
                  onChange={(e) => setDraftEmail(e.target.value)}
                  style={inputStyle}
                />
                <button
                  className="btn btn-warning text-dark"
                  type="button"
                  onClick={async () => {
                    await onUpdateEmail(draftEmail);
                  }}
                >
                  {t.updateEmail}
                </button>
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
                  className="btn btn-warning text-dark"
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
                >
                  {isSavingUsername ? "..." : t.updateUsername}
                </button>
              </div>

              <div className="d-grid gap-2">
                <button
                  className="btn btn-warning text-dark"
                  type="button"
                  onClick={async () => {
                    await onResetPassword();
                  }}
                >
                  {t.resetPassword}
                </button>
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
