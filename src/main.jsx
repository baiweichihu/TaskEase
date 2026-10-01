import React from "react";
import ReactDOM from "react-dom/client";
// Manrope 本地打包（离线可用，替代此前的 Google Fonts 外链）
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
