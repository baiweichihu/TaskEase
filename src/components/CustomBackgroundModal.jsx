import { useEffect, useRef, useState } from "react";
import { ModalShell } from "./ModalShell";

const BG_STORAGE_KEY = "taskease_bg_history";

export function CustomBackgroundModal({
  isOpen,
  onClose,
  onConfirm,
  t,
  themeColors,
  pageBg,
}) {
  const [backgrounds, setBackgrounds] = useState([]);
  const [sortBy, setSortBy] = useState("time");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadBackgrounds();
    }
  }, [isOpen]);

  const loadBackgrounds = () => {
    try {
      const stored = localStorage.getItem(BG_STORAGE_KEY);
      const data = stored ? JSON.parse(stored) : [];
      setBackgrounds(Array.isArray(data) ? data : []);
    } catch {
      setBackgrounds([]);
    }
  };

  const saveBackgrounds = (list) => {
    try {
      localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(list));
      setBackgrounds(list);
    } catch {
      /* ignore */
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const newBg = {
          id: Date.now(),
          dataUrl: reader.result,
          name: file.name,
          uploadTime: new Date().toISOString(),
          size: file.size,
        };
        const updated = [newBg, ...backgrounds];
        saveBackgrounds(updated);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const getSortedBackgrounds = () => {
    const sorted = [...backgrounds];
    if (sortBy === "time") {
      return sorted.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
    } else {
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sortedBgs = getSortedBackgrounds();

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      <ModalShell isOpen={isOpen} onClose={onClose} closeOnBackdrop role="dialog" ariaModal="true">
        {(requestClose) => (
        <div
          className="modal-dialog modal-dialog-centered"
          style={{ width: "calc(100vw - 24px)", maxWidth: "800px", margin: "0 auto" }}
        >
          <div className="modal-content" style={{ backgroundColor: pageBg, maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header border-0">
              <h5 className="modal-title fw-semibold">{t.themeCustomBg}</h5>
              <button type="button" className="btn-close" onClick={requestClose} aria-label={t.close} />
            </div>

            <div style={{ padding: "0 1rem", borderBottom: "1px solid #e0e0e0", display: "flex", gap: "1rem", alignItems: "center", fontSize: "0.85rem" }}>
              <span style={{ color: "#6c757d" }}>{t.customBgSort || "Sort"}</span>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setSortBy("time")}
                style={{
                  backgroundColor: sortBy === "time" ? themeColors.activeBtn : "transparent",
                  borderColor: themeColors.softBtnBorder,
                  color: sortBy === "time" ? "#2b2b2b" : "currentColor",
                }}
              >
                {t.customBgSortTime || "Upload time"}
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setSortBy("name")}
                style={{
                  backgroundColor: sortBy === "name" ? themeColors.activeBtn : "transparent",
                  borderColor: themeColors.softBtnBorder,
                  color: sortBy === "name" ? "#2b2b2b" : "currentColor",
                }}
              >
                {t.customBgSortName || "File name"}
              </button>
            </div>

            <div
              className="modal-body"
              style={{
                overflow: "auto",
                flex: 1,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "12px",
                padding: "1rem",
              }}
            >
              {sortedBgs.map((bg) => (
                <div
                  key={bg.id}
                  style={{
                    border: `1px solid ${themeColors.softBtnBorder}`,
                    borderRadius: "4px",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                  onClick={() => {
                    onConfirm(bg.dataUrl);
                    requestClose();
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100px",
                      backgroundImage: `url(${bg.dataUrl})`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }}
                  />
                  <div style={{ padding: "6px", backgroundColor: "rgba(0,0,0,0.02)" }}>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {bg.name}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "#6c757d", marginTop: "2px" }}>
                      {formatDate(bg.uploadTime)}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn p-0 border-2"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  borderColor: themeColors.softBtnBorder,
                  borderStyle: "dashed",
                  height: "120px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  backgroundColor: "transparent",
                  color: themeColors.softBtn,
                }}
              >
                <div style={{ fontSize: "2rem" }}>+</div>
                <div style={{ fontSize: "0.7rem" }}>{t.customBgAddNew}</div>
              </button>
            </div>

            {backgrounds.length === 0 && (
              <div className="modal-footer border-0 text-center" style={{ padding: "1rem" }}>
                <span style={{ color: "#6c757d", fontSize: "0.85rem" }}>{t.customBgEmpty || 'No backgrounds yet. Click "+" to add one.'}</span>
              </div>
            )}
          </div>
        </div>
      )}
      </ModalShell>
    </>
  );
}
