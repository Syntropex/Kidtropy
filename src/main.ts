import "./styles.css";
import "./learn/learn.css";
import { boot } from "./app";

boot();

// Offline support: cache the app after the first visit.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline support is a bonus */
    });
  });
}

// Stop iOS from zooming on double-tap / pinch while little fingers play.
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("dblclick", (e) => e.preventDefault());
