import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isUserOrOrgPage = repositoryName?.endsWith(".github.io");

// Project Pages needs /<repo>/ base, while user/org Pages uses /
const pagesBase = process.env.GITHUB_ACTIONS
  ? isUserOrOrgPage
    ? "/"
    : repositoryName
      ? `/${repositoryName}/`
      : "/"
  : "/";

export default defineConfig({
  plugins: [react()],
  base: pagesBase,
});
