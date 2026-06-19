import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../components/App';
import '../styles/tailwind.css';

function injectCopilot() {
  const existingContainer = document.getElementById('yardstick-copilot-root');
  if (existingContainer) return;

  const container = document.createElement('div');
  container.id = 'yardstick-copilot-root';
  
  // Style to ensure it floats on top of the page on the right side
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.right = '0';
  container.style.height = '100vh';
  container.style.zIndex = '999999';
  
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Inject the UI once the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectCopilot);
} else {
  injectCopilot();
}
