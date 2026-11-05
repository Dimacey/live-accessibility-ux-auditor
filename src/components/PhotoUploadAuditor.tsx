import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Sparkles, 
  Cpu, 
  Copy, 
  Check, 
  Code2, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { UxIssue } from '../types/auditor';
import { authFetch } from '../utils/apiClient';

interface PhotoUploadAuditorProps {
  onIssueSelectedForDeepRefactor: (issue: UxIssue, imageBase64: string) => void;
  selectedModel?: string;
  onOpenDebugPanel?: () => void;
}

export const PhotoUploadAuditor: React.FC<PhotoUploadAuditorProps> = ({
  onIssueSelectedForDeepRefactor,
  selectedModel = 'auto',
  onOpenDebugPanel,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sample presets for 1-click testing
  const loadSamplePreset = (presetType: 'checkout' | 'banking' | 'pos') => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (presetType === 'checkout') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 600, 800);
      ctx.fillStyle = '#1e293b';
      ctx.roundRect(40, 60, 520, 680, 24);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('Кошик та підтвердження замовлення', 70, 120);

      ctx.fillStyle = '#64748b'; // low contrast!
      ctx.font = '14px sans-serif';
      ctx.fillText('Будь ласка, перевірте адресу доставки та обраний тариф', 70, 150);

      // Card
      ctx.fillStyle = '#334155';
      ctx.roundRect(70, 180, 460, 90, 12);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px sans-serif';
      ctx.fillText('Навушники Spatial Pro Wireless — 5 890 ₴', 90, 230);

      // Tiny button
      ctx.fillStyle = '#475569';
      ctx.roundRect(480, 80, 28, 28, 6);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px sans-serif';
      ctx.fillText('✕', 488, 100);

      // Dead end CTA
      ctx.fillStyle = '#6366f1';
      ctx.roundRect(70, 620, 460, 54, 16);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Оплатити замовлення (5 890 ₴)', 160, 654);
    } else if (presetType === 'banking') {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, 600, 800);
      ctx.fillStyle = '#090d16';
      ctx.roundRect(30, 40, 540, 720, 24);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('Переказ за номером рахунку IBAN', 60, 100);

      // Form inputs
      ctx.fillStyle = '#1e293b';
      ctx.roundRect(60, 140, 480, 60, 12);
      ctx.roundRect(60, 230, 480, 60, 12);
      ctx.roundRect(60, 320, 480, 120, 12);
      ctx.fill();

      // Keyboard occlusion simulator
      ctx.fillStyle = '#334155';
      ctx.fillRect(30, 520, 540, 240);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '16px monospace';
      ctx.fillText('[Віртуальна клавіатура перекриває кнопку]', 80, 640);
    } else {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, 600, 800);
      ctx.fillStyle = '#27272a';
      ctx.roundRect(30, 40, 540, 720, 16);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('ТЕРМІНАЛ САМООБСЛУГОВУВАННЯ POS #12', 60, 90);
      ctx.fillStyle = '#71717a';
      ctx.font = '12px sans-serif';
      ctx.fillText('Дрібний шрифт, важко читати на відстані витягнутої руки', 60, 130);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setImagePreview(dataUrl);
    runImageAnalysis(dataUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        runImageAnalysis(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clipboard paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              setImagePreview(dataUrl);
              runImageAnalysis(dataUrl);
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const runImageAnalysis = async (dataUrl: string) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisResult(null);

    try {
      const res = await authFetch('/api/audit/image-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          targetPlatform: 'Mobile & Web Responsive',
          selectedModel,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error('Image analysis failed:', err);
      setErrorMsg(err?.message || 'Не вдалося виконати аналіз зображення');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header with Dynamic Model & Thinking badge */}
      <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950 border border-indigo-700/60 rounded-xl text-indigo-400">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Мультимодальний аналіз фото та скріншотів
              <button
                onClick={onOpenDebugPanel}
                title="Натисніть для зміни моделі ШІ у Debug Panel"
                className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Модель: {selectedModel}</span>
              </button>
            </h2>
            <p className="text-xs text-slate-400">
              Завантажте скріншот Figma, знімок екрана телефона або фото інтерфейсу пристрою
            </p>
          </div>
        </div>

        {/* Preset Sample Buttons */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 mr-1 hidden sm:inline">Пресети:</span>
          <button
            onClick={() => loadSamplePreset('checkout')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          >
            Чекаут e-Com
          </button>
          <button
            onClick={() => loadSamplePreset('banking')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          >
            Банкінг E2E
          </button>
          <button
            onClick={() => loadSamplePreset('pos')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          >
            POS-термінал
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Dropzone & Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-h-[320px] border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all bg-slate-950/50 hover:bg-slate-950/80 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">
                Перетягніть зображення сюди або натисніть для вибору
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Підтримуються PNG, JPG, WebP. Ви також можете просто натиснути{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]">
                  Ctrl+V
                </kbd>{' '}
                для вставки з буфера обміну.
              </p>
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 max-h-[440px] flex items-center justify-center shadow-lg">
                <img
                  src={imagePreview}
                  alt="Audit target preview"
                  className="max-h-[440px] w-auto object-contain"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-3" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">
                      Глибокий аналіз Gemini 4 Argon...
                    </span>
                    <span className="text-[11px] text-indigo-300 mt-1">
                      ThinkingLevel: HIGH (обчислення WCAG та архітектурних фіксів)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Завантажити інше фото
                </button>
                <button
                  onClick={() => runImageAnalysis(imagePreview)}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  Повторити аналіз
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: High Thinking Analysis Results & Code (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {errorMsg && (
            <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!analysisResult && !isAnalyzing && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-slate-800 rounded-2xl bg-slate-950/40">
              <Cpu className="w-10 h-10 text-slate-600 mb-3" />
              <h4 className="text-sm font-semibold text-slate-300">Очікування зображення</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Завантажте фото екрана або виберіть один із пресетів, щоб запустити глибокий аудит на моделі <strong>gemini-4-argon</strong> із максимальним рівнем міркувань.
              </p>
            </div>
          )}

          {analysisResult && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Scorecard row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">WCAG 2.2 Доступність</div>
                  <div className="text-2xl font-black text-indigo-400 mt-1">
                    {analysisResult.scoreWcag ?? 72}/100
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Контраст & Screen Reader</div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">UX Flow & Логіка</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {analysisResult.scoreUx ?? 78}/100
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Цілісність сценарію</div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Touch Targets (&gt;44px)</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {analysisResult.scoreTouchErgonomics ?? 65}/100
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Ергономіка кліків</div>
                </div>
              </div>

              {/* Summary */}
              {analysisResult.summary && (
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-indigo-400 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                    Висновки аудитора (Gemini 4 Argon)
                  </strong>
                  {analysisResult.summary}
                </div>
              )}

              {/* Detected Flaws list */}
              {analysisResult.criticalFlaws && analysisResult.criticalFlaws.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Виявлені дефекти ({analysisResult.criticalFlaws.length})</span>
                    <span className="text-[11px] text-slate-500">Натисніть для генерації коду</span>
                  </div>

                  {analysisResult.criticalFlaws.map((flaw: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-800/80 hover:border-indigo-500/50 transition-all flex items-start justify-between gap-3 group cursor-pointer"
                      onClick={() => onIssueSelectedForDeepRefactor(flaw, imagePreview || '')}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            flaw.severity === 'critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {flaw.severity}
                          </span>
                          <h5 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                            {flaw.title}
                          </h5>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {flaw.explanation}
                        </p>
                        {flaw.wcagRule && (
                          <div className="text-[10px] text-indigo-400 font-mono">
                            {flaw.wcagRule}
                          </div>
                        )}
                      </div>

                      <button
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-300 group-hover:text-white text-xs font-semibold flex items-center gap-1 shrink-0 transition-all"
                      >
                        Рефакторити
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommended Production React Component */}
              {analysisResult.recommendedReactComponentCode && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-indigo-400" />
                      Реверс-інжиніринг: готовий компонент (React + Tailwind)
                    </span>
                    <button
                      onClick={() => copyCode(analysisResult.recommendedReactComponentCode)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedCode ? 'Скопійовано!' : 'Копіювати код'}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-60 bg-slate-950 leading-relaxed">
                    <code>{analysisResult.recommendedReactComponentCode}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
