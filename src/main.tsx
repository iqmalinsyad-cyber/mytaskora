import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public declare props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-xl font-bold">Ralat Aplikasi Dikesan</h2>
            </div>
            <p className="text-slate-300 text-sm">
              Terdapat ralat semasa memuatkan komponen sistem. Ini mungkin disebabkan oleh data simpanan tempatan (localStorage) yang tidak sah atau masalah sambungan.
            </p>
            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-rose-300 overflow-x-auto">
                {this.state.error.message || 'Ralat tidak diketahui'}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 hover:bg-blue-500 font-bold py-2.5 px-4 rounded-xl text-sm transition-all"
              >
                Muat Semula
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 bg-slate-700 hover:bg-slate-600 font-bold py-2.5 px-4 rounded-xl text-sm transition-all"
              >
                Reset Data & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

