import React from "react";
import ReactDOM from "react-dom/client"; // Use "react-dom/client" for React 18+
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(<App />);
} else {
  console.error("Error: Root element not found in index.html!");
}