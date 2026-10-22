import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safeguard Response.prototype.json against transient HTML responses (e.g. <!doctype html> during server restarts)
Response.prototype.json = async function () {
  const text = await this.text();
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith('<')) {
    return {
      success: false,
      error: 'Server temporarily unavailable or returned non-JSON response',
    };
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return {
      success: false,
      error: 'Invalid JSON response from server',
    };
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
