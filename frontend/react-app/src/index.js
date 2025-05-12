import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as Sentry from "@sentry/react";

const dsn = process.env.REACT_APP_SENTRY_DSN_URL || null;
if (dsn) {
  Sentry.init({
    dsn,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true
  });
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
);
