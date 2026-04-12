import { useState, useCallback } from "react";
import { ModalShell } from "./ModalShell";

export function TaskLabelsModal({
  isOpen,
  onClose,
  t,
  labels = [],
  onLabelsChange,
  onRequestDeleteLabel,
  themeColors,
  pageBg,
  resolvedTheme,
  isCustomBgTheme = false,
}) {
  const [newLabelInput, setNewLabelInput] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

  const dangerButtonStyle = {
    backgroundColor: "#f8d7da",
    borderColor: "#f5c6cb",
    color: "#721c24",
  };

  const normalizeLabel = useCallback((label) => {
    return String(label || "").trim();
  }, []);

  const validateLabel = useCallback((label) => {
    const normalized = normalizeLabel(label);
    if (!normalized) {
      setErrorMessage(t.tagValidationEmpty || "标签不能为空");
      return false;
    }
    if (normalized.length > 20) {
      setErrorMessage(t.tagValidationTooLong || "标签长度不能超过20个字符");
      return false;
    }
    // Check for duplicates (case-insensitive)
    const exists = labels.some(
      (l, idx) =>
        normalizeLabel(l).toLowerCase() === normalized.toLowerCase() &&
        idx !== editingIndex
    );
    if (exists) {
      setErrorMessage(t.tagValidationDuplicate || "标签已存在");
      return false;
    }
    return true;
  }, [editingIndex, labels, normalizeLabel, t.tagValidationDuplicate, t.tagValidationEmpty, t.tagValidationTooLong]);

  const handleAddLabel = useCallback(() => {
    if (!validateLabel(newLabelInput)) return;
    const normalized = normalizeLabel(newLabelInput);
    const updatedLabels = [...labels, normalized];
    onLabelsChange?.(updatedLabels);
    setNewLabelInput("");
    setErrorMessage("");
  }, [newLabelInput, labels, onLabelsChange, normalizeLabel, validateLabel]);

  const handleStartEdit = useCallback((index) => {
    setEditingIndex(index);
    setEditingValue(labels[index] || "");
    setErrorMessage("");
  }, [labels]);

  const handleSaveEdit = useCallback(() => {
    if (editingIndex === null) return;
    if (!validateLabel(editingValue)) return;

    const normalized = normalizeLabel(editingValue);
    const updatedLabels = [...labels];
    updatedLabels[editingIndex] = normalized;
    onLabelsChange?.(updatedLabels);
    setEditingIndex(null);
    setEditingValue("");
    setErrorMessage("");
  }, [editingIndex, editingValue, labels, onLabelsChange, normalizeLabel, validateLabel]);

  const handleDeleteLabel = useCallback((index) => {
    const label = labels[index] || "";
    if (typeof onRequestDeleteLabel === "function") {
      onRequestDeleteLabel(label);
    } else {
      const updatedLabels = labels.filter((_, idx) => idx !== index);
      onLabelsChange?.(updatedLabels);
    }
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingValue("");
    }
  }, [labels, onLabelsChange, editingIndex, onRequestDeleteLabel]);

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditingValue("");
    setErrorMessage("");
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        if (editingIndex !== null) {
          handleSaveEdit();
        } else {
          handleAddLabel();
        }
      } else if (e.key === "Escape") {
        if (editingIndex !== null) {
          handleCancelEdit();
        } else {
          setNewLabelInput("");
        }
      }
    },
    [editingIndex, handleAddLabel, handleSaveEdit, handleCancelEdit]
  );

  const textColor = resolvedTheme === "dark" || isCustomBgTheme ? "#f8f9fa" : "#212529";
  const inputTextColor = resolvedTheme === "dark" ? "#f8f9fa" : "#2b2b2b";

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} closeOnBackdrop>
      {(requestClose) => (
        <div className="modal-dialog" style={{ marginTop: "60px", maxWidth: "500px" }}>
          <div
            className="modal-content"
            style={{ backgroundColor: pageBg }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title fs-6" style={{ color: textColor }}>
                {t.manageLabels || "管理标签"}
              </h2>
              <button
                type="button"
                className="btn-close"
                aria-label={t.close}
                onClick={requestClose}
              />
            </div>

            <div className="modal-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
              {/* Add New Label Section */}
              <div className="d-flex gap-2 mb-3">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder={t.newTagPrompt || "新标签名称"}
                  value={newLabelInput}
                  onChange={(e) => setNewLabelInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{
                    backgroundColor: themeColors.listBg,
                    borderColor: themeColors.softBtnBorder,
                    color: inputTextColor,
                  }}
                  disabled={editingIndex !== null}
                />
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={handleAddLabel}
                  style={softButtonStyle}
                  disabled={!newLabelInput.trim() || editingIndex !== null}
                >
                  {t.add || "添加"}
                </button>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div
                  className="alert alert-warning alert-dismissible fade show"
                  role="alert"
                  style={{ fontSize: "0.85rem", marginBottom: "1rem" }}
                >
                  {errorMessage}
                  <button
                    type="button"
                    className="btn-close btn-sm"
                    onClick={() => setErrorMessage("")}
                  />
                </div>
              )}

              {/* Labels List */}
              {labels.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: textColor,
                    opacity: 0.6,
                    fontSize: "0.9rem",
                  }}
                >
                  {t.noLabels || "暂无标签"}
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {labels.map((label, index) =>
                    editingIndex === index ? (
                      <div key={index} className="input-group input-group-sm">
                        <input
                          type="text"
                          className="form-control"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          style={{
                            backgroundColor: themeColors.listBg,
                            borderColor: themeColors.activeBtnBorder,
                            color: inputTextColor,
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={handleSaveEdit}
                          style={activeButtonStyle}
                          title={t.save || "保存"}
                        >
                          <i className="bi bi-check-lg" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={handleCancelEdit}
                          style={softButtonStyle}
                          title={t.cancel || "取消"}
                        >
                          <i className="bi bi-x-lg" />
                        </button>
                      </div>
                    ) : (
                      <div
                        key={index}
                        className="d-flex justify-content-between align-items-center p-2"
                        style={{
                          backgroundColor: themeColors.listBg,
                          borderRadius: "4px",
                          border: `1px solid ${themeColors.softBtnBorder}`,
                        }}
                      >
                        <span style={{ color: textColor, flex: 1 }}>
                          #{label}
                        </span>
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            type="button"
                            className="btn"
                            onClick={() => handleStartEdit(index)}
                            style={softButtonStyle}
                            title={t.edit || "编辑"}
                          >
                            <i className="bi bi-pencil-square" />
                          </button>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => handleDeleteLabel(index)}
                            style={dangerButtonStyle}
                            title={t.delete || "删除"}
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-sm"
                onClick={requestClose}
                style={softButtonStyle}
              >
                {t.close || "关闭"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
