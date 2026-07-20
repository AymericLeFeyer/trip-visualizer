import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'maplibre-gl/dist/maplibre-gl.css';
import './index.css';
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Élément #root introuvable");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
