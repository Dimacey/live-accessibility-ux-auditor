import { 
  Eye, 
  FileText, 
  Database, 
  GitFork, 
  Camera,
  ShieldOff,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  Sliders,
  Key
} from 'lucide-react';
import { SupportedModelId } from './DebugPanel';

export type ActiveTab = 'stream_hud' | 'photo_upload' | 'broker_queue' | 'cjm_flow';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenReportModal: () => void;
  onOpenDebugPanel: () => void;
  onOpenApiKeyModal?: () => void;
  hasCustomKey?: boolean;
  issuesCount: number;
  criticalCount: number;
  onRevokeAllPermissions?: () => void;
  onOpenPermissionsModal?: () => void;
  screenPermissionGranted?: boolean;
  micPermissionGranted?: boolean;
  selectedModel: SupportedModelId;
  lastUsedModel?: string;
  hasQuotaWarning?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenReportModal,
  onOpenDebugPanel,
  onOpenApiKeyModal,
  hasCustomKey = false,
  issuesCount,
  criticalCount,
  onRevokeAllPermissions,
  onOpenPermissionsModal,
  screenPermissionGranted = true,
  micPermissionGranted = false,
  selectedModel,
  lastUsedModel,
  hasQuotaWarning,
}) => {
  const getModelBadgeLabel = () => {
    if (selectedModel === 'auto') return '✨ Auto (3.8 Flash)';
    if (selectedModel === 'gemini-4-argon') return '🧠 4 Argon';
    if (selectedModel === 'gemini-3.8-flash') return '🚀 3.8 Flash';
    if (selectedModel === 'gemini-3.5-flash-lite') return '💡 3.5 Flash Lite';
    if (selectedModel === 'gemini-3.6-flash') return '⚡ 3.6 Flash';
    if (selectedModel === 'gemini-3.1-flash-lite') return '⚡ 3.1 Flash Lite';
    if (selectedModel === 'gemini-3-flash-preview') return '🔬 3 Flash Preview';
    return '🛡️ Офлайн';
  };

  return (
    <header className="bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 py-3 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Concept */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-600/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-400">
              <Eye className="w-5 h-5 text-indigo-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                Live Accessibility & UX Auditor
              </h1>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Real-time Stream
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Мультимодальний реверс-інжиніринг інтерфейсів та UX (Real-time Computer Use & Video Stream)
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('stream_hud')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'stream_hud'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Live Стрім & HUD
          </button>

          <button
            onClick={() => setActiveTab('photo_upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'photo_upload'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Аналіз фото & Reversing
          </button>

          <button
            onClick={() => setActiveTab('broker_queue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'broker_queue'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Async Broker Pipeline
          </button>

          <button
            onClick={() => setActiveTab('cjm_flow')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'cjm_flow'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            CJM & Карта тертя
          </button>
        </div>

        {/* Right Actions: BYOK Key / AI Model Switcher / Permissions / Report */}
        <div className="flex items-center gap-2">
          {/* BYOK (Bring Your Own Key) Button */}
          {onOpenApiKeyModal && (
            <button
              onClick={onOpenApiKeyModal}
              title="Вказати або змінити власний Gemini API Key (BYOK) — для збереження квоти автора"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
                hasCustomKey
                  ? 'bg-emerald-950/70 hover:bg-emerald-900/90 border-emerald-700 text-emerald-200'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-200'
              }`}
            >
              <Key className={`w-3.5 h-3.5 ${hasCustomKey ? 'text-emerald-400' : 'text-indigo-400'}`} />
              <span className="font-mono text-[11px]">
                {hasCustomKey ? 'BYOK: Свій ключ' : 'Власний ключ (BYOK)'}
              </span>
              {hasCustomKey && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          )}

          {/* AI Model Switcher Button */}
          <button
            onClick={onOpenDebugPanel}
            title="Змінити модель ШІ (3.1 Flash Lite / 3.8 Flash / 4 Argon / Офлайн)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
              hasQuotaWarning
                ? 'bg-amber-950/80 hover:bg-amber-900 border-amber-700 text-amber-200 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            {hasQuotaWarning ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span className="font-mono text-[11px]">{getModelBadgeLabel()}</span>
            <Sliders className="w-3 h-3 text-slate-400" />
          </button>

          {/* Permissions Selector & Controls */}
          {(onOpenPermissionsModal || onRevokeAllPermissions) && (
            <button
              onClick={onOpenPermissionsModal || onRevokeAllPermissions}
              title="Керування дозволами: увімкнути чи відкликати захоплення екрана та мікрофон"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                screenPermissionGranted || micPermissionGranted
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-800'
              }`}
            >
              {screenPermissionGranted || micPermissionGranted ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ShieldOff className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className="hidden sm:inline">Дозволи</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  screenPermissionGranted && micPermissionGranted
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : screenPermissionGranted
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                    : micPermissionGranted
                    ? 'bg-teal-950 text-teal-300 border border-teal-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {screenPermissionGranted && micPermissionGranted
                  ? '2/2 Увімкнено'
                  : screenPermissionGranted
                  ? 'Екран'
                  : micPermissionGranted
                  ? 'Мікрофон'
                  : 'Всі відкликано'}
              </span>
            </button>
          )}

          {/* Executive Report */}
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-semibold shadow-sm transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">Підсумковий звіт</span>
            {issuesCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                criticalCount > 0 ? 'bg-rose-500 text-white' : 'bg-indigo-500 text-white'
              }`}>
                {issuesCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
