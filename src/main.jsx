import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import BrrrApp from './BrrrApp';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {window.location.pathname.toLowerCase().includes('brrr') ? <BrrrApp /> : <App />}
  </StrictMode>,
);
