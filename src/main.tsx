import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Attach authenticated session token to all API requests automatically
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof Request ? input.url : "";
  if (typeof url === "string" && (url.startsWith("/api/") || url.includes("/api/"))) {
    const rawSession = sessionStorage.getItem("hacker_v6_session");
    if (rawSession) {
      try {
        const session = JSON.parse(rawSession);
        if (session?.token) {
          init = init || {};
          const headers = new Headers(init.headers || {});
          if (!headers.has("x-session-token")) {
            headers.set("x-session-token", session.token);
          }
          init.headers = headers;
        }
      } catch (_) {}
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
