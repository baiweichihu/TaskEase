import { useRef, useState } from "react";

/**
 * 日期输入框。
 *
 * 为什么不用原生 <input type="date"> 直接显示文字：
 *   原生控件的占位提示由「浏览器/WebView 的界面语言」决定，页面完全无法控制。
 *   实测同一份页面在 Chromium 显示「年/月/日」，在 WebView2 里却显示「yyyy/mm/日」
 *   （年前月是拉丁字母、日是中文字，中英混搭）；且改变文档 lang 属性、设置元素 lang、
 *   写 CSS 都无效——四组对照实验渲染结果完全一致。
 *
 * 因此这里把原生控件隐藏起来只当「选择器触发器」，显示文字由本组件按应用语言渲染，
 * 这样在任何环境下显示都一致。点击输入框会调用 showPicker() 弹出系统日历。
 *
 * 兜底：万一运行环境不支持 showPicker（或调用被拒绝），
 * 自动切回「显示原生控件」的模式，保证日期仍然可以正常选择，不会出现无法操作的输入框。
 */

/** 把 YYYY-MM-DD 显示为 YYYY/MM/DD */
function formatDateDisplay(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const parts = raw.split("-");
  if (parts.length !== 3) return raw;
  return parts.join("/");
}

export function DateInput({
  value,
  onChange,
  hint,
  min,
  max,
  disabled = false,
  style,
  className = "",
}) {
  const inputRef = useRef(null);
  // true 表示 showPicker 不可用，退回显示原生控件
  const [nativeFallback, setNativeFallback] = useState(false);

  function openPicker() {
    if (disabled) return;
    const el = inputRef.current;
    if (el && typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        /* 落到下面的兜底分支 */
      }
    }
    setNativeFallback(true);
    if (el) el.focus();
  }

  const isEmpty = !value;

  return (
    <div
      className={`taskease-date-field form-control d-flex align-items-center justify-content-between gap-2 ${className}`}
      style={{ ...style, cursor: disabled ? "not-allowed" : "pointer" }}
      onClick={nativeFallback ? undefined : openPicker}
    >
      <input
        ref={inputRef}
        type="date"
        className={`taskease-date-field__native ${nativeFallback ? "is-visible" : ""}`}
        value={value || ""}
        min={min}
        max={max}
        disabled={disabled}
        onChange={onChange}
        tabIndex={nativeFallback ? undefined : -1}
        aria-label={hint}
      />
      {nativeFallback ? null : (
        <>
          <span className={`taskease-date-field__value ${isEmpty ? "is-placeholder" : ""}`}>
            {isEmpty ? hint : formatDateDisplay(value)}
          </span>
          <i className="bi bi-calendar3 taskease-date-field__icon" aria-hidden="true" />
        </>
      )}
    </div>
  );
}
