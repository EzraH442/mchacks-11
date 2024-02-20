import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import NameContext from './hooks/useNameContext';
import { ThemeProvider } from "./components/ThemeProvider"

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <NameContext.Provider value={{ names: {} }}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <App />
    </ThemeProvider>
  </NameContext.Provider>,
);
