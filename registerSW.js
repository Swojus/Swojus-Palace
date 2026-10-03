if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Avoid registering the service worker during local dev served by Vite
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return;
    }
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  });
}
