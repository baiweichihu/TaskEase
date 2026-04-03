import { ModalShell } from "./ModalShell";

export function AuthModal({
  isOpen,
  onClose,
  t,
  activeAuthTab,
  setActiveAuthTab,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  onLogin,
  registerUsername,
  setRegisterUsername,
  registerEmail,
  setRegisterEmail,
  registerPassword,
  setRegisterPassword,
  registerConfirmPassword,
  setRegisterConfirmPassword,
  onRegister,
  isLoggingIn,
  isRegistering,
  pageBg,
  themeColors,
}) {
  const registerUsernameCount = Array.from(registerUsername || "").length;
  const registerUsernameRemaining = Math.max(0, 15 - registerUsernameCount);

  const customInputStyle = {
    backgroundColor: themeColors.listBg,
    borderColor: themeColors.softBtnBorder,
    color: "#2b2b2b",
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose}>
      {(requestClose) => (
        <div className="modal-dialog" style={{ marginTop: "60px" }}>
          <div className="modal-content" style={{ backgroundColor: pageBg }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title fs-6">{t.account}</h2>
              <button type="button" className="btn-close" aria-label={t.close} onClick={requestClose} />
            </div>
            <div className="modal-body">
              <>
                  <div className="btn-group w-100 mb-3">
                    <button 
                      className="btn"
                      type="button"
                      onClick={() => setActiveAuthTab("login")}
                      style={{
                        backgroundColor: activeAuthTab === "login" ? themeColors.activeBtn : "transparent",
                        color: activeAuthTab === "login" ? "#2b2b2b" : "currentColor",
                        borderColor: themeColors.softBtnBorder,
                        borderWidth: "1px",
                      }}
                    >
                      {t.login}
                    </button>
                    <button 
                      className="btn"
                      type="button"
                      onClick={() => setActiveAuthTab("register")}
                      style={{
                        backgroundColor: activeAuthTab === "register" ? themeColors.activeBtn : "transparent",
                        color: activeAuthTab === "register" ? "#2b2b2b" : "currentColor",
                        borderColor: themeColors.softBtnBorder,
                        borderWidth: "1px",
                      }}
                    >
                      {t.register}
                    </button>
                  </div>

                  {activeAuthTab === "login" ? (
                    <form className="d-grid gap-2" onSubmit={onLogin}>
                      <input 
                        className="form-control" 
                        type="email"
                        placeholder={t.email}
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        style={customInputStyle}
                        required 
                      />
                      <input 
                        className="form-control" 
                        type="password" 
                        minLength={6} 
                        placeholder={t.password} 
                        value={loginPassword} 
                        onChange={(e) => setLoginPassword(e.target.value)}
                        style={customInputStyle}
                        required 
                      />
                      <button className="btn text-dark" style={{ backgroundColor: themeColors.softBtn, borderColor: themeColors.softBtnBorder }} type="submit" disabled={isLoggingIn}>
                        {t.login}
                        {isLoggingIn ? <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" /> : null}
                      </button>
                    </form>
                  ) : (
                    <form className="d-grid gap-2" onSubmit={onRegister}>
                      <input 
                        className="form-control" 
                        type="text" 
                        maxLength={15} 
                        placeholder={t.username} 
                        value={registerUsername} 
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        style={customInputStyle}
                        required 
                      />
                      <div className="small text-end" style={{ color: "#6b4f2f" }}>
                        {registerUsernameRemaining}/15
                      </div>
                      <input
                        className="form-control"
                        type="email"
                        autoComplete="email"
                        placeholder={t.email}
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        style={customInputStyle}
                        required
                      />
                      <input 
                        className="form-control" 
                        type="password" 
                        minLength={6} 
                        placeholder={t.password} 
                        value={registerPassword} 
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        style={customInputStyle}
                        required 
                      />
                      <input 
                        className="form-control" 
                        type="password" 
                        minLength={6} 
                        placeholder={t.confirmPassword} 
                        value={registerConfirmPassword} 
                        onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                        style={customInputStyle}
                        required 
                      />
                      <button className="btn text-dark" style={{ backgroundColor: themeColors.softBtn, borderColor: themeColors.softBtnBorder }} type="submit" disabled={isRegistering}>
                        {t.register}
                        {isRegistering ? <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" /> : null}
                      </button>
                    </form>
                  )}
              </>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
