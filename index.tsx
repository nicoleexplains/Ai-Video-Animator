
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Fix: Moved global AIStudio type declaration here to prevent duplicate declaration errors.
// Add window.aistudio types for Veo API key selection
// Fix: Moved AIStudio interface inside the declare global block to fix a subsequent property declaration error.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);