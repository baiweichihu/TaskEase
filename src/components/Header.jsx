import { useRef, useEffect, useState } from "react";

export function Header({
  t,
  user,
  username,
  themeMode,
  setThemeMode,
  lang,
  setLang,
  clockFormat,
  setClockFormat,
  onLoginClick,
  onLogout,
  onOpenProfileSettings,
  onManualSync,
  isSyncing,
  logoColor,
  pageBg,
  resolvedTheme,
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    const onDown = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <header className="d-flex justify-content-between align-items-center mb-3">
      <div className="fw-semibold fs-4" style={{ fontFamily: "Manrope, Noto Sans SC, sans-serif", color: logoColor }}>
        TaskEase
      </div>

      <div className="d-flex align-items-center gap-2">
        <div className="position-relative" ref={settingsRef}>
          <button
            className="btn d-flex align-items-center gap-2"
            type="button"
            onClick={() => setIsSettingsOpen((v) => !v)}
            title={t.settings}
            style={{
              backgroundColor: resolvedTheme === "dark" ? "#d39d0c" : "#e0ae1c",
              color: "#2b2b2b",
              border: "1px solid #c79000",
              fontWeight: 600,
            }}
          >
            <span>{user ? username : t.account + " & " + t.settings}</span>
          </button>
          {isSettingsOpen ? (
            <div className="dropdown-menu show mt-2 p-3 shadow" style={{ width: "320px", right: 0, left: "auto", backgroundColor: pageBg }}>
              <div className="d-grid gap-3">
                <div className="d-flex justify-content-between align-items-center gap-2">
                  <div className="small text-dark" style={{ fontWeight: 500 }}>{t.language}</div>
                  <div className="btn-group btn-group-sm" role="group" aria-label="Language" style={{ marginLeft: "auto" }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setLang("zh-CN")}
                      style={{ backgroundColor: lang === "zh-CN" ? "#e0ae1c" : "#faefdf", borderColor: "#e9bd34", color: "#2b2b2b" }}
                    >
                      简
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setLang("zh-TW")}
                      style={{ backgroundColor: lang === "zh-TW" ? "#e0ae1c" : "#faefdf", borderColor: "#e9bd34", color: "#2b2b2b" }}
                    >
                      繁
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setLang("en")}
                      style={{ backgroundColor: lang === "en" ? "#e0ae1c" : "#faefdf", borderColor: "#e9bd34", color: "#2b2b2b" }}
                    >
                      Eng
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center gap-2">
                  <div className="small text-dark" style={{ fontWeight: 500 }}>{t.settings}</div>
                  <div className="btn-group btn-group-sm" role="group" aria-label="Theme" style={{ marginLeft: "auto" }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setThemeMode("light")}
                      style={{ backgroundColor: themeMode === "light" ? "#e0ae1c" : "#faefdf", borderColor: "#e9bd34", color: "#2b2b2b" }}
                      title="Light"
                    >
                      <i className="bi bi-sun-fill" />
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setThemeMode("dark")}
                      style={{ backgroundColor: themeMode === "dark" ? "#e0ae1c" : "#faefdf", borderColor: "#e9bd34", color: "#2b2b2b" }}
                      title="Dark"
                    >
                      <i className="bi bi-moon-stars-fill" />
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setThemeMode("system")}
                      style={{ backgroundColor: themeMode === "system" ? "#e0ae1c" : "#faefdf", borderColor: "#e9bd34", color: "#2b2b2b" }}
                      title="System"
                    >
                      <i className="bi bi-circle-half" />
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center gap-2">
                  <div className="small text-dark" style={{ fontWeight: 500 }}>{t.clockFormat}</div>
                  <div className="btn-group btn-group-sm" role="group" aria-label="Clock Format" style={{ marginLeft: "auto" }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setClockFormat("24h")}
                      style={{ backgroundColor: clockFormat === "24h" ? "#e0ae1c" : "#faefdf", borderColor: "#e9bd34", color: "#2b2b2b" }}
                    >
                      24h
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setClockFormat("12h")}
                      style={{ backgroundColor: clockFormat === "12h" ? "#e0ae1c" : "#faefdf", borderColor: "#e9bd34", color: "#2b2b2b" }}
                    >
                      12h
                    </button>
                  </div>
                </div>

                {user ? (
                  <>
                    <button className="btn btn-sm" type="button" onClick={() => {
                      onOpenProfileSettings();
                      setIsSettingsOpen(false);
                    }} style={{ backgroundColor: "#faefdf", color: "#2b2b2b", border: "1px solid #e9bd34" }}>
                      {t.profileSettings}
                    </button>
                    <button 
                      className="btn btn-sm" 
                      type="button" 
                      onClick={() => {
                        onManualSync();
                        setIsSettingsOpen(false);
                      }}
                      disabled={isSyncing}
                      style={{ 
                        backgroundColor: isSyncing ? "#6c757d" : "#28a745", 
                        color: "white", 
                        border: "none" 
                      }}
                    >
                      {isSyncing ? "同步中..." : "云同步"}
                    </button>
                  </>
                ) : (
                  <button className="btn btn-sm" type="button" onClick={() => {
                    onLoginClick("login");
                    setIsSettingsOpen(false);
                  }} style={{ backgroundColor: "#faefdf", color: "#2b2b2b", border: "1px solid #e9bd34" }}>
                    {t.login} / {t.register}
                  </button>
                )}

                {user ? (
                  <button className="btn btn-sm" type="button" onClick={() => {
                    onLogout();
                    setIsSettingsOpen(false);
                  }} style={{ backgroundColor: "#d32f2f", color: "white", border: "none" }}>
                    {t.logout}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
