import { Component, StrictMode } from 'react';
import type { ErrorInfo, PropsWithChildren } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './styles.css';

type ErrorBoundaryState = {
  hasError: boolean;
};

class AppErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(
    _error: Error,
  ): ErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('श्रुति ऐप में त्रुटि:', error);
    console.error('त्रुटि का विवरण:', info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="startup-error" role="alert">
          <div
            className="startup-error__mark"
            aria-hidden="true"
          >
            ॐ
          </div>

          <h1>श्रुति</h1>

          <p>
            ऐप में कोई त्रुटि आ गई है।
            कृपया पृष्ठ को फिर से खोलें।
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            फिर से प्रयास करें
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  const message = document.createElement('main');

  message.className = 'startup-error';
  message.setAttribute('role', 'alert');

  const heading = document.createElement('h1');
  heading.textContent = 'श्रुति';

  const description = document.createElement('p');
  description.textContent =
    'ऐप शुरू नहीं हो पाया। index.html में id="root" वाला तत्व नहीं मिला।';

  const retryButton = document.createElement('button');
  retryButton.type = 'button';
  retryButton.textContent = 'फिर से प्रयास करें';
  retryButton.addEventListener('click', () => {
    window.location.reload();
  });

  message.append(heading, description, retryButton);
  document.body.appendChild(message);
} else {
  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>,
  );
}
