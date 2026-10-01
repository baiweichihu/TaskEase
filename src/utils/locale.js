/**
 * 应用语言与日期/时间格式化。
 *
 * 关键原则：**不要使用 `toLocaleString()`、`toLocaleTimeString([])` 这类不带 locale 的调用**。
 * 它们跟随的是「操作系统语言」，而不是「应用内选择的语言」，会出现
 * 切到英文界面后日期仍按中文格式显示的混搭问题（与原生日期控件占位符是同一类坑）。
 * 所有展示给用户的日期时间都必须显式传入这里的 locale。
 */

/** 应用语言 → BCP-47 locale */
export function getAppLocale(lang) {
  return lang === "en" ? "en-US" : "zh-CN";
}

/**
 * 取「本地时区」的 YYYY-MM-DD。
 * 不要用 toISOString().slice(0,10)，它按 UTC 计算，在 UTC+8 等时区会跨天。
 */
export function toLocalDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
