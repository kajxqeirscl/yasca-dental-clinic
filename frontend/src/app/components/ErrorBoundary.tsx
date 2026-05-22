import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    // Here we could also report to Sentry/API if configured
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600 animate-pulse" />
            </div>
            
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              Bir Hata Oluştu
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              Sistem beklenmeyen bir durumla karşılaştı. Sayfayı yenileyerek veya ana sayfaya dönerek devam edebilirsiniz.
            </p>

            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left font-mono text-xs text-slate-600 mb-6 max-h-32 overflow-y-auto">
                <span className="font-bold text-red-600">Error:</span> {this.state.error.message}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Ana Sayfa
              </Button>
              <Button
                onClick={this.handleReload}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-lg shadow-indigo-100"
              >
                <RefreshCw className="w-4 h-4" />
                Yeniden Dene
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
