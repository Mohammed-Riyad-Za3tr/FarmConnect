import '@/i18n';
import '@/styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';

const root = document.getElementById('root');

if (!root) {
  throw new Error('[main] Could not find #root element');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
