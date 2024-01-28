import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import NameContext from './hooks/useNameContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <NameContext.Provider value={{ names: {} }}>
    <App />
  </NameContext.Provider>,
);
