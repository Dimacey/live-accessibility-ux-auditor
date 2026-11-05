import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside Live UX Auditor:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearAndReset = () => {
    try {
      localStorage.removeItem('ux_auditor_issues');
      localStorage.removeItem('ux_auditor_stats');
      localStorage.removeItem('ux_auditor_voice_notes');
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    this.handleReset();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 select-none">
          <div className="w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-950 border border-rose-800 rounded-2xl text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-100">
                  Аварійне перехоплення сесії (Error Boundary)
                </h1>
                <p className="text-xs text-slate-400">
                  ШІ-аудитор перехопив критичну помилку середовища
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-rose-400 font-semibold font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{this.state.error?.name || 'Помилка виконання'}: {this.state.error?.message || 'Невідомий збій рендерингу'}</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Ваші дані сесії та результати аналізу збережені в локальному сховищі браузера. Ви можете безпечно відновити сесію.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Відновити роботу аудитора</span>
              </button>

              <button
                onClick={this.handleClearAndReset}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
                title="Очистити локальний кеш та перезавантажити"
              >
                Скинути кеш сесії
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
