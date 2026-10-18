// Browser extension compatibility shim for window.fetch
try {
  let _fetchImpl = window.fetch ? window.fetch.bind(window) : undefined;
  Object.defineProperty(window, 'fetch', {
    get() {
      return _fetchImpl;
    },
    set(fn) {
      _fetchImpl = fn;
    },
    configurable: true,
    enumerable: true,
  });
} catch {
  // Ignore if already configured
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
