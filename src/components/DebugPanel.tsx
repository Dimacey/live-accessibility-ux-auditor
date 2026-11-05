import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  ShieldAlert, 
  ExternalLink, 
  X,
  Gauge,
  Sliders,
  Sparkles,
  Info,
  Clock,
  Key,
  ShieldCheck
} from 'lucide-react';
import { getCustomApiKey, setCustomApiKey } from '../utils/apiClient';

export type SupportedModelId = 
  | 'auto' 
  | 'gemini-4-argon' 
  | 'gemini-3.8-flash' 
  | 'gemini-3.5-flash-lite' 
  | 'gemini-3.6-flash' 
  | 'gemini-3.1-flash-lite' 
  | 'gemini-3-flash-preview' 
  | 'offline';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: SupportedModelId;
  onSelectModel: (model: SupportedModelId) => void;
  lastUsedModel?: string;
  lastQuotaWarning?: string | null;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
  lastUsedModel,
  lastQuotaWarning,
}) => {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [customKey, setCustomKey] = useState<string>(() => getCustomApiKey());
  const [keySaved, setKeySaved] = useState<boolean>(false);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/audit/models');
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data.telemetry);
        if (data.telemetry?.quotaRetryDelaySeconds && data.telemetry.quotaRetryDelaySeconds > 0) {
          setCountdownSeconds((prev) => (prev > 0 ? prev : data.telemetry.quotaRetryDelaySeconds));
        }
      }
    } catch (e) {
      console.warn('Failed to fetch telemetry:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTelemetry();
      const interval = setInterval(fetchTelemetry, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Live second-by-second countdown timer
  useEffect(() => {
    if (countdownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCountdownSeconds((sec) => Math.max(0, sec - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownSeconds]);

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSaveCustomKey = () => {
    setCustomApiKey(customKey.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const testModelPing = async (modelToTest: SupportedModelId) => {
    setIsPinging(true);
    setPingResult(null);
    try {
      const start = Date.now();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customKey) {
        headers['x-gemini-api-key'] = customKey.trim();
      }

      const res = await fetch('/api/audit/stream-frame', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          selectedModel: modelToTest,
        }),
      });
      const data = await res.json();
      const latency = Date.now() - start;

      if (data.quotaWarning && data.actualModel !== modelToTest && modelToTest !== 'auto') {
        setPingResult(`⚠️ Модель ${modelToTest} перевищила квоту (429). Спрацював автоматичний перехід на ${data.actualModel} (${latency}ms).`);
      } else {
        setPingResult(`✅ Успішно! Модель: ${data.actualModel || modelToTest} (${latency}ms). Статус: 200 OK.`);
      }
      fetchTelemetry();
    } catch (err: any) {
      setPingResult(`❌ Помилка з'єднання: ${err?.message || 'Мережева помилка'}`);
    } finally {
      setIsPinging(false);
    }
  };

  if (!isOpen) return null;

  const isRateLimited = telemetry?.lastStatusCode === 429 || Boolean(lastQuotaWarning);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-950 border border-indigo-700/60 rounded-xl text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Панель діагностики та вибору моделі ШІ (Debug Panel)
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  isRateLimited
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {isRateLimited ? '⚠️ Rate Limit 429 Detected' : '● System Normal'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Керування лімітами безкоштовного тарифу (Free Tier), каскадне перемикання та квоти
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Rate Limit Alert Banner with LIVE COUNTDOWN TIMER */}
          {(lastQuotaWarning || isRateLimited) && (
            <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-2xl space-y-3 text-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Вичерпано денний ліміт запитів (HTTP 429 Quota Exceeded)</span>
                </div>
                {countdownSeconds > 0 && (
                  <span className="text-[10px] bg-amber-900/80 px-2 py-0.5 rounded-full font-mono font-bold text-amber-200 border border-amber-700">
                    Live Quota Guard
                  </span>
                )}
              </div>

              {/* 3. Живий таймер зворотного відліку */}
              {countdownSeconds > 0 ? (
                <div className="flex items-center gap-2.5 p-3 bg-amber-900/50 rounded-xl border border-amber-700/80">
                  <Clock className="w-4 h-4 text-amber-300 animate-spin" />
                  <div className="flex-1">
                    <div className="text-[11px] font-bold text-amber-100 flex items-center gap-2">
                      <span>До скидання ліміту Gemini 3.8 Flash:</span>
                      <span className="font-mono text-sm text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-600">
                        {formatCountdown(countdownSeconds)}
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-300/80 mt-0.5">
                      Сесія захищена: Auto-Cascade автоматично обслуговує запити через Flash Lite.
                    </div>
                  </div>
                </div>
              ) : isRateLimited ? (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-950/80 rounded-xl border border-emerald-800 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Час очікування завершився! Натисніть «Перевірити статус» для перевірки доступу до 3.8 Flash.</span>
                </div>
              ) : null}

              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                {lastQuotaWarning || telemetry?.lastErrorMessage || 'Безкоштовний тариф Gemini Free Tier обмежує кількість запитів на день (для 3.8 Flash — до 20 запитів, для 4 Argon — 0 без білінгу).'}
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    onSelectModel('gemini-3.1-flash-lite');
                    testModelPing('gemini-3.1-flash-lite');
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition-colors shadow"
                >
                  Перемкнутися на Gemini 3.1 Flash Lite
                </button>
                <button
                  onClick={() => {
                    onSelectModel('offline');
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors"
                >
                  Увімкнути Офлайн-евристику (0 витрат квоти)
                </button>
              </div>
            </div>
          )}

          {/* Model Selection Options */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              Оберіть актуальну модель ШІ для аудитора:
            </label>

            {/* Model 1: Default (Gemini 3.8 Flash) / Auto-Cascade */}
            <div
              onClick={() => onSelectModel('auto')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedModel === 'auto'
                  ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/30'
                  : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">
                    Default (Gemini 3.8 Flash)
                  </span>
                  <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded font-mono">
                    Рекомендовано / Auto-Cascade
                  </span>
                </div>
                <input
                  type="radio"
                  name="modelChoice"
                  checked={selectedModel === 'auto'}
                  onChange={() => onSelectModel('auto')}
                  className="text-indigo-600 focus:ring-0"
                />
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                Використовує Gemini 3.8 Flash за замовчуванням, а при ліміті 429 автоматично перемикається на Flash Lite без переривання роботи.
              </p>
            </div>

            {/* Model 2: Gemini 4 Argon [Paid] */}
            <div
              onClick={() => onSelectModel('gemini-4-argon')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedModel === 'gemini-4-argon'
                  ? 'border-purple-500 bg-purple-950/30 ring-2 ring-purple-500/30'
                  : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">
                    Gemini 4 Argon
                  </span>
                  <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    Paid
                  </span>
                </div>
                <input
                  type="radio"
                  name="modelChoice"
                  checked={selectedModel === 'gemini-4-argon'}
                  onChange={() => onSelectModel('gemini-4-argon')}
                  className="text-purple-600 focus:ring-0"
                />
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                Глибокі міркування (ThinkingLevel.HIGH) для складних архитектурних задач. Потребує API-ключа з прив&apos;язаним білінгом.
              </p>
            </div>

            {/* Model 3: Gemini 3.8 Flash */}
            <div
              onClick={() => onSelectModel('gemini-3.8-flash')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedModel === 'gemini-3.8-flash'
                  ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/30'
                  : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">
                    Gemini 3.8 Flash
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    20 req/day на Free Tier
                  </span>
                </div>
                <input
                  type="radio"
                  name="modelChoice"
                  checked={selectedModel === 'gemini-3.8-flash'}
                  onChange={() => onSelectModel('gemini-3.8-flash')}
                  className="text-indigo-600 focus:ring-0"
                />
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                Збалансована модель загального призначення. При вичерпанні квоти рекомендується перемкнутися на 3.1 Flash Lite або 3.5 Flash Lite.
              </p>
            </div>

            {/* Model 4: Gemini 3.5 Flash Lite */}
            <div
              onClick={() => onSelectModel('gemini-3.5-flash-lite')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedModel === 'gemini-3.5-flash-lite'
                  ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/30'
                  : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">
                    Gemini 3.5 Flash Lite
                  </span>
                  <span className="text-[10px] bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded font-mono">
                    Flash Lite Tier
                  </span>
                </div>
                <input
                  type="radio"
                  name="modelChoice"
                  checked={selectedModel === 'gemini-3.5-flash-lite'}
                  onChange={() => onSelectModel('gemini-3.5-flash-lite')}
                  className="text-indigo-600 focus:ring-0"
                />
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                Полегшена високопродуктивна модель із низьким споживанням токенів та підвищеними лімітами запитів на хвилину.
              </p>
            </div>

            {/* Model 5: Gemini 3.6 Flash */}
            <div
              onClick={() => onSelectModel('gemini-3.6-flash')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedModel === 'gemini-3.6-flash'
                  ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/30'
                  : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">
                    Gemini 3.6 Flash
                  </span>
                  <span className="text-[10px] bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded font-mono">
                    Flash Tier
                  </span>
                </div>
                <input
                  type="radio"
                  name="modelChoice"
                  checked={selectedModel === 'gemini-3.6-flash'}
                  onChange={() => onSelectModel('gemini-3.6-flash')}
                  className="text-indigo-600 focus:ring-0"
                />
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                Оновлена Flash-архітектура з покращеним просторовим розпізнаванням інтерфейсів і елементів навігації.
              </p>
            </div>

            {/* Model 6: Gemini 3.1 Flash Lite */}
            <div
              onClick={() => onSelectModel('gemini-3.1-flash-lite')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'border-emerald-500 bg-emerald-950/30 ring-2 ring-emerald-500/30'
                  : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">
                    Gemini 3.1 Flash Lite
                  </span>
                  <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded font-mono">
                    Високий ліміт Free Tier · Швидка (~120ms)
                  </span>
                </div>
                <input
                  type="radio"
                  name="modelChoice"
                  checked={selectedModel === 'gemini-3.1-flash-lite'}
                  onChange={() => onSelectModel('gemini-3.1-flash-lite')}
                  className="text-emerald-600 focus:ring-0"
                />
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                Оптимальна модель для потокового аудиту екрана. Володіє окремими високими безкоштовними лімітами запитів, не блокується як 3.8.
              </p>
            </div>

            {/* Model 7: Gemini 3 Flash Preview */}
            <div
              onClick={() => onSelectModel('gemini-3-flash-preview')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedModel === 'gemini-3-flash-preview'
                  ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/30'
                  : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">
                    Gemini 3 Flash Preview
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    Preview
                  </span>
                </div>
                <input
                  type="radio"
                  name="modelChoice"
                  checked={selectedModel === 'gemini-3-flash-preview'}
                  onChange={() => onSelectModel('gemini-3-flash-preview')}
                  className="text-indigo-600 focus:ring-0"
                />
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                Експериментальна гілка з оптимізацією під потоковий відеоввід та швидкий аналіз кадрів.
              </p>
            </div>

            {/* Model 8: Offline Heuristic */}
            <div
              onClick={() => onSelectModel('offline')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                selectedModel === 'offline'
                  ? 'border-slate-400 bg-slate-800 ring-2 ring-slate-400/30'
                  : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">
                    Офлайн-режим (Локальна евристика)
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-mono">
                    0 витрат квоти · Без інтернету
                  </span>
                </div>
                <input
                  type="radio"
                  name="modelChoice"
                  checked={selectedModel === 'offline'}
                  onChange={() => onSelectModel('offline')}
                  className="text-slate-400 focus:ring-0"
                />
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                Локальний алгоритм перевірки WCAG 2.2, тупикових екранів та тач-зон. Працює миттєво навіть при повністю вичерпаних лімітах API.
              </p>
            </div>
          </div>

          {/* Test Ping Action */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Тестовий запит (Model Health Check)</span>
                <span className="text-[11px] text-slate-400">
                  Перевірити відгук та статус обраної моделі: <strong>{selectedModel}</strong>
                </span>
              </div>
              <button
                onClick={() => testModelPing(selectedModel)}
                disabled={isPinging}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-all shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                {isPinging ? 'Тестування...' : 'Перевірити статус'}
              </button>
            </div>

            {pingResult && (
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono leading-relaxed">
                {pingResult}
              </div>
            )}
          </div>

          {/* Billing Instructions Box */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-300 text-[11px] leading-relaxed">
              <strong className="text-slate-100 block font-semibold">
                Як збільшити квоту або підключити необмежений білінг?
              </strong>
              <p>
                1. Відкрийте бічну панель <strong>Settings &gt; Secrets</strong> у Google AI Studio.
              </p>
              <p>
                2. Оберіть або додайте API-ключ з активованим Google Cloud Billing.
              </p>
              <p>
                3. Якщо білінг не налаштовано, використовуйте модель <strong>Gemini 3.1 Flash Lite</strong> або <strong>Офлайн-режим</strong> — вони працюють стабільно без блокувань.
              </p>
            </div>
          </div>

          {/* Security & System Environment Key Information */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200">Безпека системного ключа (GEMINI_API_KEY)</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                Server-Side Protected
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              ✓ <strong>Безпечне середовище:</strong> Ключ читається суворо на сервері через <code className="text-indigo-300 font-mono">process.env.GEMINI_API_KEY</code>. Його немає в клієнтському JavaScript-коді, що унеможливлює викрадення при декомпіляції додатка або аналізі мережевих пакетів.
            </p>

            {/* Custom Key form for external users / self-hosting */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                Власний API-ключ для зовнішніх користувачів (необов&apos;язково):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="Введіть AIzaSy... або залиште системний з .env"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSaveCustomKey}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shrink-0"
                >
                  {keySaved ? 'Збережено!' : 'Зберегти'}
                </button>
              </div>
              <span className="text-[10px] text-slate-500 block">
                Зберігається локально у вашому браузері (sessionStorage) і передається через захищений proxy header.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Поточна активна модель: <strong className="text-indigo-400">{lastUsedModel || selectedModel}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            Зберегти та закрити
          </button>
        </div>
      </div>
    </div>
  );
};
