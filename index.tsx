import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/App';
import '@/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
const SPLASH_MIN_DURATION_MS = 5200;
const splashStart = performance.now();

const mountApp = () => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

const elapsed = performance.now() - splashStart;
const delay = Math.max(0, SPLASH_MIN_DURATION_MS - elapsed);
window.setTimeout(() => {
  window.requestAnimationFrame(mountApp);
}, delay);

// The service worker URL is intentionally relative to the deployed document,
// so the same historical build works at /CheckList/ on GitHub Pages and at /
// during local development without requiring runtime-visible configuration.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}
