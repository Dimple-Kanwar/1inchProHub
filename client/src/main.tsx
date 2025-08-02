import React from "react";
import ReactDOM from "react-dom/client";
import { WebSocketProvider } from "./shared/providers/WebSocketProvider";
import App from "./App"; 
import "./index.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WebSocketProvider>
      <App />
    </WebSocketProvider>
  </React.StrictMode>
);