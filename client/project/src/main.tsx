import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';

import App from './App.tsx';
import '@/index.css';
import { BrowserRouter as Router } from 'react-router-dom';

window.Buffer = Buffer;
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>
);
