// frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter> {/* BrowserRouter should wrap AuthProvider */}
      <AuthProvider>
        <App /> {/* App component now handles only routes and UI, not BrowserRouter */}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);