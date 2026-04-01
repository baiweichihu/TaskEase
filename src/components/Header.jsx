import { useState } from "react";
import { CustomBackgroundModal } from "./CustomBackgroundModal";

export function Header({
  t,
  user,
  username,
  themeMode,
  setThemeMode,
  themePreset,
  setThemePreset,
  customBackground,
  setCustomBackground,
  themeColors,
  isCustomBgTheme,
  lang,
  setLang,
  clockFormat,
  setClockFormat,
  onLoginClick,
  onLogout,
  onOpenProfileSettings,
  onManualSync,
  isSyncing,
  autoSyncEnabled,
  onToggleAutoSync,
  logoColor,
  pageBg,
  resolvedTheme,
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCustomBgModalOpen, setIsCustomBgModalOpen] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isManualSyncLoading, setIsManualSyncLoading] = useState(false);
  const labelTextColor = resolvedTheme === "dark" || isCustomBgTheme ? "#f8f9fa" : "#212529";

  const softButtonStyle = {
    backgroundColor: themeColors.softBtn,
    borderColor: themeColors.softBtnBorder,
    color: "#2b2b2b",
  };

  const activeButtonStyle = {
    backgroundColor: themeColors.activeBtn,
    borderColor: themeColors.activeBtnBorder,
    color: "#2b2b2b",
  };

  function themePresetSwatch(preset) {
    if (preset === "beige") return "#f2c84b";
    if (preset === "pink") return "#f3b7cc";
    if (preset === "blue") return "#9fc7eb";
    if (preset === "lavender") return "#cab3e8";
    return "#8c8c8c";
  }

  const handleCustomBgConfirm = (bgValue) => {
    setCustomBackground(bgValue);
    setThemePreset("custom-bg");
  };

  return (
    <header className="d-flex justify-content-between align-items-center mb-3">
      <div className="fw-semibold fs-4" style={{ fontFamily: "Manrope, Noto Sans SC, sans-serif", color: logoColor }}>
        TaskEase
      </div>

      <div className="d-flex align-items-center gap-2">
        <div className="position-relative">
          <button
            className="btn d-flex align-items-center gap-2"
            type="button"
            onClick={() => setIsSettingsOpen((v) => !v)}
            title={t.settings}
            style={{
              backgroundColor: themeColors.softBtn,
              color: "#2b2b2b",
              border: `1px solid ${themeColors.softBtnBorder}`,
              fontWeight: 600,
            }}
          >
            <span>{user ? username : t.account + " & " + t.settings}</span>
          </button>
          {isSettingsOpen ? (
            <>
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
              onClick={() => setIsSettingsOpen(false)}
            />
            <div className="modal d-block" tabIndex="-1" style={{ zIndex: 1050, animation: "slideDown 0.4s ease-out" }}>
              <div className="modal-dialog" style={{ marginTop: "60px" }}>
                <div className="modal-content" style={{ backgroundColor: pageBg }}>
                  <div className="modal-header">
                    <h2 className="modal-title fs-6">{t.settings}</h2>
                    <button type="button" className="btn-close" onClick={() => setIsSettingsOpen(false)} />
                  </div>
                  <div className="modal-body">
              <div className="d-grid gap-3">
                <div className="d-flex justify-content-between align-items-center gap-2">
                  <div className="small" style={{ fontWeight: 500, color: labelTextColor }}>{t.language}</div>
                  <div className="btn-group btn-group-sm" role="group" aria-label="Language" style={{ marginLeft: "auto" }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setLang("zh-CN")}
                      style={lang === "zh-CN" ? activeButtonStyle : softButtonStyle}
                    >
                      简
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setLang("zh-TW")}
                      style={lang === "zh-TW" ? activeButtonStyle : softButtonStyle}
                    >
                      繁
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setLang("en")}
                      style={lang === "en" ? activeButtonStyle : softButtonStyle}
                    >
                      Eng
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center gap-2">
                  <div className="small" style={{ fontWeight: 500, color: labelTextColor }}>{t.settings}</div>
                  <div className="btn-group btn-group-sm" role="group" aria-label="Theme" style={{ marginLeft: "auto" }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setThemeMode("light")}
                      style={themeMode === "light" ? activeButtonStyle : softButtonStyle}
                      title="Light"
                    >
                      <i className="bi bi-sun-fill" />
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setThemeMode("dark")}
                      style={themeMode === "dark" ? activeButtonStyle : softButtonStyle}
                      title="Dark"
                    >
                      <i className="bi bi-moon-stars-fill" />
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setThemeMode("system")}
                      style={themeMode === "system" ? activeButtonStyle : softButtonStyle}
                      title="System"
                    >
                      <i className="bi bi-circle-half" />
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center gap-2">
                  <div className="small" style={{ fontWeight: 500, color: labelTextColor }}>{t.themePalette}</div>
                  <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end" style={{ marginLeft: "auto" }}>
                    {[
                      ["beige", t.themeBeige],
                      ["pink", t.themePink],
                      ["blue", t.themeBlue],
                      ["lavender", t.themeLavender],
                    ].map(([preset, label]) => (
                      <button
                        key={preset}
                        type="button"
                        className="btn p-0"
                        onClick={() => setThemePreset(preset)}
                        title={label}
                        style={{
                          width: "1.2rem",
                          height: "1.2rem",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 0,
                          border: themePreset === preset ? `3px solid #2b2b2b` : `1px solid rgba(0, 0, 0, 0.25)`,
                          backgroundColor: themePresetSwatch(preset),
                        }}
                      />
                    ))}
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => setIsCustomBgModalOpen(true)}
                      title={t.themeCustomBg}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: themePreset === "custom-bg" ? "#0d6efd" : labelTextColor,
                        textDecoration: "underline",
                        padding: 0,
                        fontWeight: 600,
                      }}
                    >
                      {t.themeCustomBg}
                    </button>
                  </div>
                </div>


                <div className="d-flex justify-content-between align-items-center gap-2">
                  <div className="small" style={{ fontWeight: 500, color: labelTextColor }}>{t.clockFormat}</div>
                  <div className="btn-group btn-group-sm" role="group" aria-label="Clock Format" style={{ marginLeft: "auto" }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setClockFormat("24h")}
                      style={clockFormat === "24h" ? activeButtonStyle : softButtonStyle}
                    >
                      24h
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setClockFormat("12h")}
                      style={clockFormat === "12h" ? activeButtonStyle : softButtonStyle}
                    >
                      12h
                    </button>
                  </div>
                </div>

                {user ? (
                  <div className="d-flex justify-content-between align-items-center gap-2">
                    <div className="small" style={{ fontWeight: 500, color: labelTextColor }}>{t.autoSyncLabel}</div>
                    <div className="btn-group btn-group-sm" role="group" aria-label="Auto Sync" style={{ marginLeft: "auto" }}>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => onToggleAutoSync(true)}
                        style={autoSyncEnabled ? activeButtonStyle : softButtonStyle}
                      >
                        {t.autoSyncOn}
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => onToggleAutoSync(false)}
                        style={!autoSyncEnabled ? activeButtonStyle : softButtonStyle}
                      >
                        {t.autoSyncOff}
                      </button>
                    </div>
                  </div>
                ) : null}

                {user ? (
                  <>
                    <button className="btn btn-sm" type="button" onClick={() => {
                      onOpenProfileSettings();
                      setIsSettingsOpen(false);
                    }} style={{ backgroundColor: themeColors.softBtn, color: "#2b2b2b", border: `1px solid ${themeColors.softBtnBorder}` }}>
                      {t.profileSettings}
                    </button>
                    <button 
                      className="btn btn-sm" 
                      type="button" 
                      onClick={async () => {
                        if (isManualSyncLoading) return;
                        setIsManualSyncLoading(true);
                        try {
                          const ok = await onManualSync();
                          if (ok) setIsSettingsOpen(false);
                        } finally {
                          setIsManualSyncLoading(false);
                        }
                      }}
                      disabled={isSyncing || isManualSyncLoading}
                      style={{ 
                        backgroundColor: isSyncing || isManualSyncLoading ? "#6c757d" : "#28a745", 
                        color: "white", 
                        border: "none" 
                      }}
                    >
                      {isSyncing || isManualSyncLoading ? t.syncing : t.syncNow}
                      {isSyncing || isManualSyncLoading ? <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" /> : null}
                    </button>
                  </>
                ) : (
                  <button className="btn btn-sm" type="button" onClick={() => {
                    onLoginClick("login");
                    setIsSettingsOpen(false);
                  }} style={{ backgroundColor: themeColors.softBtn, color: "#2b2b2b", border: `1px solid ${themeColors.softBtnBorder}` }}>
                    {t.login} / {t.register}
                  </button>
                )}

                {user ? (
                  <button className="btn btn-sm" type="button" onClick={async () => {
                    if (isLogoutLoading) return;
                    setIsLogoutLoading(true);
                    try {
                      const ok = await onLogout();
                      if (ok) setIsSettingsOpen(false);
                    } finally {
                      setIsLogoutLoading(false);
                    }
                  }} style={{ backgroundColor: "#d32f2f", color: "white", border: "none" }}>
                    {t.logout}
                    {isLogoutLoading ? <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" /> : null}
                  </button>
                ) : null}
              </div>
                  </div>
                </div>
              </div>
            </div>
            </>
          ) : null}
        </div>
      </div>

      <CustomBackgroundModal
        isOpen={isCustomBgModalOpen}
        onClose={() => setIsCustomBgModalOpen(false)}
        onConfirm={handleCustomBgConfirm}
        t={t}
        themeColors={themeColors}
        pageBg={pageBg}
        currentBackground={customBackground}
      />
    </header>
  );
}
