import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Tauri 在执行 beforeDevCommand / beforeBuildCommand 时会注入 TAURI_ENV_* 环境变量。
// 也允许通过 VITE_BUILD_TARGET=desktop 手动指定（便于不带 Tauri 单独构建桌面产物）。
const isDesktopBuild = Boolean(
  process.env.TAURI_ENV_PLATFORM || process.env.VITE_BUILD_TARGET === "desktop",
);

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isUserOrOrgPage = repositoryName?.endsWith(".github.io");

// 网页版（GitHub Pages）需要 /<repo>/ 作为 base，用户/组织主页则用 /
const pagesBase = process.env.GITHUB_ACTIONS
  ? isUserOrOrgPage
    ? "/"
    : repositoryName
      ? `/${repositoryName}/`
      : "/"
  : "/";

export default defineConfig({
  plugins: [react()],
  // 桌面版通过 Tauri 自定义协议加载，必须使用相对路径；网页版沿用绝对路径
  base: isDesktopBuild ? "./" : pagesBase,
  build: {
    sourcemap: false,
  },
});
