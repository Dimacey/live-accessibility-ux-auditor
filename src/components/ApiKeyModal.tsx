import React, { useState, useEffect } from 'react';
import { 
  Key, 
  ShieldCheck, 
  X, 
  Check, 
  Trash2, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  HelpCircle,
  Cpu
} from 'lucide-react';
import { getCustomApiKey, setCustomApiKey, clearCustomApiKey } from '../utils/apiClient';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyChanged?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyChanged,
}) => {
  const [keyValue, setKeyValue] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    model?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setKeyValue(getCustomApiKey());
      setTestResult(null);
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = keyValue.trim();
    setCustomApiKey(trimmed);
    setIsSaved(true);
    setTestResult(null);
    onKeyChanged?.();
    setTimeout(() => {
      setIsSaved(false);
    }, 2500);
  };

  const handleClear = () => {
    clearCustomApiKey();
    setKeyValue('');
    setTestResult(null);
    onKeyChanged?.();
  };

  const handleTestKey = async () => {
    const keyToTest = keyValue.trim();
    if (!keyToTest) {
      setTestResult({
        success: false,
        message: 'Будь ласка, спочатку введіть ключ або збережіть його.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const startTime = Date.now();
      const res = await fetch('/api/audit/stream-frame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': keyToTest,
        },
        body: JSON.stringify({
          imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          selectedModel: 'gemini-3.1-flash-lite',
        }),
      });

      const latency = Date.now() - startTime;
      const data = await res.json();

      if (res.ok && data.actualModel && !data.quotaWarning?.includes('429')) {
        setTestResult({
          success: true,
          message: `Ключ дійсний! Зв'язок із Gemini успішний (${latency}ms). Квоту перевірено.`,
          model: data.actualModel,
        });
      } else {
        setTestResult({
          success: false,
          message: data.quotaWarning || 'Не вдалося перевірити ключ. Перевірте правильність символів AIzaSy...',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Помилка мережевого зʼєднання при перевірці ключа.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const hasKey = Boolean(getCustomApiKey());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="byok-modal-title"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
              <Key className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="byok-modal-title" className="text-base font-bold text-white tracking-tight">
                  Власний Gemini API Key (BYOK)
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                  hasKey
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {hasKey ? '✓ Власний ключ активний' : 'Хост / Демо'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Bring Your Own Key — безпечне використання персональної квоти Google AI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Закрити"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Key Input Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Ваш Google Gemini API Key:
              </label>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
              >
                Отримати безкоштовний ключ
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-2xl px-4 py-3 text-xs text-slate-100 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/20 pr-24"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  aria-label={showKey ? 'Приховати ключ' : 'Показати ключ'}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {keyValue && (
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Очистити поле"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Формат ключа: починається з <code className="text-slate-400 font-mono">AIzaSy...</code>
            </p>
          </div>

          {/* Action Buttons: Save & Test */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSave}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Ключ успішно збережено!
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Зберегти мій ключ
                </>
              )}
            </button>

            <button
              onClick={handleTestKey}
              disabled={isTesting || !keyValue.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  Перевірка...
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  Перевірити підключення (Ping)
                </>
              )}
            </button>
          </div>

          {/* Test Status Feedback */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
                : 'bg-rose-950/60 border-rose-800/80 text-rose-200'
            }`}>
              {testResult.success ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="font-semibold">{testResult.message}</p>
                {testResult.model && (
                  <p className="text-[11px] font-mono text-emerald-300">
                    Активна модель: {testResult.model}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Security & Architecture Guarantees */}
          <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80 space-y-2.5 text-xs">
            <h4 className="font-semibold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Гарантії приватності та захисту:
            </h4>
            <ul className="space-y-2 text-slate-400 text-[11px] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>
                  <strong>Локальне сховище браузера:</strong> Ваш API-ключ зберігається виключно у вашому браузері (Local Secure Storage) і ніколи не записується в базу даних.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>
                  <strong>Захист квоти автора:</strong> Усі ваші запити до живого ШІ під час сканування та рефакторингу списуються з вашого власного персонального ліміту Google.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>
                  <strong>Повна безпека на GitHub & Cloud Run:</strong> Системний ключ автора надійно захищений у контейнері сервера та виключений з репозиторію через <code className="text-indigo-300 font-mono">.gitignore</code>.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {hasKey ? 'Режим: Персональний API-ключ' : 'Режим: Демонстраційний (Default Host)'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};
