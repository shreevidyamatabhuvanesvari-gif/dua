import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

function StartupError() {
  return (
    <main className="startup-error" role="alert">
      <div className="startup-error__mark" aria-hidden="true">
        ॐ
      </div>
      <h1>श्रुति</h1>
      <p>ऐप शुरू नहीं हो पाया। कृपया पृष्ठ को फिर से खोलें।</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
      >
        फिर से प्रयास करें
      </button>
    </main>
  );
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '';

  const message = document.createElement('main');
  message.className = 'startup-error';
  message.setAttribute('role', 'alert');
  message.textContent =
    'ऐप शुरू नहीं हो पाया: index.html में id="root" वाला तत्व नहीं मिला।';

  document.body.appendChild(message);
} else {
  const root = createRoot(rootElement);

  try {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('श्रुति ऐप शुरू करने में त्रुटि:', error);
    root.render(<StartupError />);
  }
}
