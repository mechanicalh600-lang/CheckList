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

// The historical repository already contains a manifest and service worker.
// Register it using Vite's resolved base path so GitHub Pages scopes it to
// /CheckList/ instead of the account root. This changes no visible UI.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}
