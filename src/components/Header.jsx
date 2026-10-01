import { useState } from "react";
import { ModalShell } from "./ModalShell";

export function Header({
  t,
  themeMode,
  setThemeMode,
  themeColors,
  lang,
  setLang,
  clockFormat,
  setClockFormat,
  onOpenPomodoroManage,
  onOpenAbout,
  onOpenDataStats,
  logoColor,
  pageBg,
  resolvedTheme,
  onOpenTaskLabelsModal,
  onOpenDataBackup,
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const labelTextColor = resolvedTheme === "dark" ? "#f8f9fa" : "#212529";

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

  function openSettings() {
    setIsSettingsOpen(true);
  }

  function closeSettings() {
    setIsSettingsOpen(false);
  }

  return (
    <header className="d-flex justify-content-between align-items-center mb-3">
      <div className="fw-semibold fs-4" style={{ fontFamily: "var(--te-font-display)", color: logoColor }}>
        TaskEase
      </div>

      <div className="d-flex align-items-center gap-2">
        <div className="position-relative">
          <button
            className="btn d-flex align-items-center gap-2"
            type="button"
            onClick={() => (isSettingsOpen ? closeSettings() : openSettings())}
            title={t.settings}
            style={{
              backgroundColor: themeColors.softBtn,
              color: "#2b2b2b",
              border: `1px solid ${themeColors.softBtnBorder}`,
              fontWeight: 600,
            }}
          >
            <span>{t.settings}</span>
          </button>
          <ModalShell isOpen={isSettingsOpen} onClose={closeSettings} closeOnBackdrop>
            {(requestClose) => (
              <div className="modal-dialog" style={{ marginTop: "60px" }}>
                <div className="modal-content" style={{ backgroundColor: pageBg }} onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2 className="modal-title fs-6">{t.settings}</h2>
                    <button type="button" className="btn-close" onClick={requestClose} />
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
                            中
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
                        <div className="small" style={{ fontWeight: 500, color: labelTextColor }}>{t.themeLabel}</div>
                        <div className="btn-group btn-group-sm" role="group" aria-label="Theme" style={{ marginLeft: "auto" }}>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => setThemeMode("light")}
                            style={themeMode === "light" ? activeButtonStyle : softButtonStyle}
                            title={t.themeLight}
                          >
                            <i className="bi bi-sun-fill" />
                          </button>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => setThemeMode("dark")}
                            style={themeMode === "dark" ? activeButtonStyle : softButtonStyle}
                            title={t.themeDark}
                          >
                            <i className="bi bi-moon-stars-fill" />
                          </button>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => setThemeMode("system")}
                            style={themeMode === "system" ? activeButtonStyle : softButtonStyle}
                            title={t.themeSystem}
                          >
                            <i className="bi bi-circle-half" />
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

                      <div className="d-grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        <button
                          className="btn btn-sm"
                          type="button"
                          onClick={() => {
                            onOpenDataStats?.();
                            closeSettings();
                          }}
                          style={{ backgroundColor: themeColors.softBtn, color: "#2b2b2b", border: `1px solid ${themeColors.softBtnBorder}` }}
                        >
                          {t.dataStats}
                        </button>
                        <button
                          className="btn btn-sm"
                          type="button"
                          onClick={() => {
                            onOpenPomodoroManage?.();
                            closeSettings();
                          }}
                          style={{ backgroundColor: themeColors.softBtn, color: "#2b2b2b", border: `1px solid ${themeColors.softBtnBorder}` }}
                        >
                          {t.pomodoroManage}
                        </button>
                      </div>

                      <div className="d-grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        <button
                          className="btn btn-sm"
                          type="button"
                          onClick={() => {
                            onOpenTaskLabelsModal?.();
                            closeSettings();
                          }}
                          style={{ backgroundColor: themeColors.softBtn, color: "#2b2b2b", border: `1px solid ${themeColors.softBtnBorder}` }}
                        >
                          {t.manageLabels}
                        </button>
                        <button
                          className="btn btn-sm"
                          type="button"
                          onClick={() => {
                            onOpenAbout?.();
                            closeSettings();
                          }}
                          style={{ backgroundColor: themeColors.softBtn, color: "#2b2b2b", border: `1px solid ${themeColors.softBtnBorder}` }}
                        >
                          {t.aboutUs}
                        </button>
                      </div>

                      <button
                        className="btn btn-sm"
                        type="button"
                        style={{ backgroundColor: themeColors.softBtn, color: "#2b2b2b", border: `1px solid ${themeColors.softBtnBorder}` }}
                        onClick={() => {
                          onOpenDataBackup?.();
                          closeSettings();
                        }}
                      >
                        {t.dataBackup}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ModalShell>
        </div>
      </div>
    </header>
  );
}
