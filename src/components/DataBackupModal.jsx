import { useEffect, useState } from "react";
import { ModalShell } from "./ModalShell";
import { exportBackup, importBackup } from "../storage/backup";

/**
 * 数据与备份：手动导出 / 导入备份。
 *
 * 桌面端走系统原生的「保存 / 打开」对话框；网页 demo 退化为浏览器下载与文件选择。
 * 导入会覆盖现有数据，因此有二次确认。
 */
export function DataBackupModal({
  isOpen,
  onClose,
  t,
  pageBg,
  themeColors,
  onImported,
  onNotify,
}) {
  const [step, setStep] = useState("main");
  const [busy, setBusy] = useState("");
  const [exportedPath, setExportedPath] = useState("");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setStep("main");
      setBusy("");
      setExportedPath("");
      setErrorText("");
    }
  }, [isOpen]);

  const actionBtnStyle = {
    backgroundColor: themeColors.softBtn,
    borderColor: themeColors.softBtnBorder,
    color: "#2b2b2b",
  };
  const dangerBtnStyle = {
    backgroundColor: "#d32f2f",
    borderColor: "#b71c1c",
    color: "#ffffff",
  };
  const boxStyle = {
    backgroundColor: themeColors.listBg,
    border: `1px solid ${themeColors.softBtnBorder}`,
    borderRadius: "8px",
    padding: "12px",
  };

  async function handleExport() {
    setBusy("export");
    setErrorText("");
    try {
      const result = await exportBackup();
      if (result.cancelled) return;
      setExportedPath(result.path);
      onNotify?.(t.exportBackupSuccess, false);
    } catch (error) {
      setErrorText(String(error?.message || error));
      onNotify?.(t.exportBackupFailed, true);
    } finally {
      setBusy("");
    }
  }

  async function handleImportConfirmed() {
    setBusy("import");
    setErrorText("");
    try {
      const result = await importBackup();
      if (result.cancelled) {
        setStep("main");
        return;
      }
      const counts = result.counts || { todos: 0, sessions: 0, labels: 0 };
      onNotify?.(
        `${t.importBackupSuccess} ${counts.todos} ${t.unitTasks} / ${counts.sessions} ${t.unitSessions}`,
        false,
      );
      await onImported?.();
      setStep("main");
    } catch (error) {
      setErrorText(String(error?.message || error));
      onNotify?.(t.importBackupFailed, true);
    } finally {
      setBusy("");
    }
  }

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} backdropZIndex={1060} modalZIndex={1070}>
      {(requestClose) => (
        <div className="modal-dialog" style={{ marginTop: "60px" }}>
          <div className="modal-content" style={{ backgroundColor: pageBg }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title fs-6">
                {step === "confirmImport" ? t.importBackupConfirmTitle : t.dataBackup}
              </h2>
              <button type="button" className="btn-close" aria-label={t.close} onClick={requestClose} />
            </div>

            <div className="modal-body d-grid gap-3">
              {step === "confirmImport" ? (
                <>
                  <div style={{ color: "#d32f2f", fontWeight: 600 }}>{t.importBackupConfirmTitle}</div>
                  <div style={{ color: "#2b2b2b" }}>{t.importBackupConfirmMessage}</div>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn"
                      style={actionBtnStyle}
                      disabled={busy === "import"}
                      onClick={() => setStep("main")}
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={dangerBtnStyle}
                      disabled={busy === "import"}
                      onClick={handleImportConfirmed}
                    >
                      {t.importBackupConfirm}
                      {busy === "import" ? (
                        <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" />
                      ) : null}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={boxStyle}>
                    <div className="small fw-semibold mb-1" style={{ color: "#2b2b2b" }}>
                      {t.backupSection}
                    </div>
                    <div className="small mb-2" style={{ color: "#2b2b2b", opacity: 0.85 }}>
                      {t.backupHint}
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        type="button"
                        className="btn"
                        style={actionBtnStyle}
                        disabled={busy === "export"}
                        onClick={handleExport}
                      >
                        {t.exportBackup}
                        {busy === "export" ? (
                          <span className="spinner-border spinner-border-sm ms-2" aria-hidden="true" />
                        ) : null}
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={actionBtnStyle}
                        disabled={Boolean(busy)}
                        onClick={() => setStep("confirmImport")}
                      >
                        {t.importBackup}
                      </button>
                    </div>
                    {exportedPath ? (
                      <div className="small mt-2 text-break" style={{ color: "#28a745" }}>
                        {exportedPath}
                      </div>
                    ) : null}
                  </div>

                  <div className="small" style={{ color: "#6b4f2f" }}>
                    {t.backupRestoreHint}
                  </div>

                  {errorText ? (
                    <div className="small" style={{ color: "#d32f2f" }}>
                      {errorText}
                    </div>
                  ) : null}
                </>
              )}
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
