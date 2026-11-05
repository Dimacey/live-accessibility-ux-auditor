import React, { useState, useEffect, useCallback } from 'react';
import { 
  Header, 
  ActiveTab 
} from './components/Header';
import { EdgeTierStreamViewer } from './components/EdgeTierStreamViewer';
import { PhotoUploadAuditor } from './components/PhotoUploadAuditor';
import { BrokerQueueInspector } from './components/BrokerQueueInspector';
import { CjmGraphView } from './components/CjmGraphView';
import { DeepRefactorDrawer } from './components/DeepRefactorDrawer';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { DebugPanel, SupportedModelId } from './components/DebugPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import { UxIssue, BrokerQueueItem, SessionStats, CjmData, VoiceNote } from './types/auditor';
import { voiceDictation } from './utils/voiceDictation';
import { authFetch, hasCustomApiKey } from './utils/apiClient';
import { 
  MousePointerClick, 
  Sparkles, 
  ArrowRight, 
  FileText, 
  ShieldCheck, 
  ShieldOff,
  Mic,
  MicOff, 
  Monitor,
  Check,
  X,
  AlertTriangle,
  Cpu,
  Sliders,
  RotateCcw
} from 'lucide-react';

const STORAGE_KEY_ISSUES = 'ux_auditor_issues_v1';
const STORAGE_KEY_STATS = 'ux_auditor_stats_v1';
const STORAGE_KEY_VOICE = 'ux_auditor_voice_notes_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('stream_hud');
  const [currentIssues, setCurrentIssues] = useState<UxIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<UxIssue | null>(null);
  const [isRefactorDrawerOpen, setIsRefactorDrawerOpen] = useState<boolean>(false);
  const [activeFrameSnapshot, setActiveFrameSnapshot] = useState<string | null>(null);

  // Model Selection & Debug Panel State
  const [selectedModel, setSelectedModel] = useState<SupportedModelId>('auto');
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [hasCustomKey, setHasCustomKey] = useState<boolean>(() => hasCustomApiKey());
  const [lastUsedModel, setLastUsedModel] = useState<string>('gemini-3.1-flash-lite');
  const [lastQuotaWarning, setLastQuotaWarning] = useState<string | null>(null);

  // Permissions & Privacy State (Screen & Mic toggles)
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [permissionRevokeCount, setPermissionRevokeCount] = useState<number>(0);
  const [screenPermissionGranted, setScreenPermissionGranted] = useState<boolean>(true);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean>(false);

  // 4. Voice Dictation Notes state for UX Audits
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);

  // Broker Queue & Pipeline State
  const [brokerQueue, setBrokerQueue] = useState<BrokerQueueItem[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);

  // CJM State
  const [cjmData, setCjmData] = useState<CjmData | null>(null);
  const [isCjmLoading, setIsCjmLoading] = useState<boolean>(false);

  // Executive Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportMarkdown, setReportMarkdown] = useState<string>('');

  // Active Sandbox Scenario
  const [activeScenarioName, setActiveScenarioName] = useState<string>('Чекаут e-Com & Тупиковий екран UX');

  // Filter state for side issue list
  const [issueFilter, setIssueFilter] = useState<'all' | 'critical' | 'wcag_a11y' | 'touch_target' | 'ux_deadend'>('all');

  // Session Statistics
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    framesScanned: 18,
    issuesDetected: 3,
    criticalBlockers: 1,
    wcagScore: 74,
    rageClicks: 0,
    sessionDuration: 45,
  });

  // Initial seed issues in Ukrainian
  useEffect(() => {
    const initialIssues: UxIssue[] = [
      {
        id: 'init-1',
        title: 'Тупиковий екран після замовлення (Відсутня кнопка повернення)',
        category: 'ux_deadend',
        severity: 'critical',
        wcagRule: 'Nielsen Norman Heuristic #3: User control and freedom',
        explanation: 'Екран успішного підтвердження не надає кнопку переходу в каталог або на головний екран. Користувач заблокований у сценарії.',
        boundingBox: { x: 10, y: 35, width: 80, height: 40 },
        quickFix: 'Додати навігаційний футер із Primary Button "Перейти до замовлень" та Secondary "В каталог".',
      },
      {
        id: 'init-2',
        title: 'Критично мала зона натискання хрестика закриття (< 24px)',
        category: 'touch_target',
        severity: 'high',
        wcagRule: 'WCAG 2.5.5 Target Size (Minimum 44x44px for Touch)',
        explanation: 'Кнопка закриття вікна має розмір лише 20x20px. У 43% випадків користувачі мобільних пристроїв промахуються, що викликає фрустрацію.',
        boundingBox: { x: 80, y: 2, width: 15, height: 8 },
        quickFix: 'Збільшити контейнер до min-w-[44px] min-h-[44px] з p-3 та hitSlop.',
      },
      {
        id: 'init-3',
        title: 'Недостатній контраст тексту умов (Коефіцієнт 2.1:1)',
        category: 'wcag_a11y',
        severity: 'medium',
        wcagRule: 'WCAG 1.4.3 Contrast (Minimum) Level AA',
        explanation: 'Текст угоди #64748b на темному фоні має коефіцієнт контрастності 2.1:1 при необхідному мінімумі 4.5:1.',
        boundingBox: { x: 8, y: 72, width: 84, height: 12 },
        quickFix: 'Замінити колір шрифту на #cbd5e1 (Slate 300) для досягнення 7.2:1.',
      },
    ];

    // Load persisted issues or fallback to seed
    try {
      const savedIssues = localStorage.getItem(STORAGE_KEY_ISSUES);
      if (savedIssues) {
        const parsed = JSON.parse(savedIssues);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCurrentIssues(parsed);
        } else {
          setCurrentIssues(initialIssues);
        }
      } else {
        setCurrentIssues(initialIssues);
      }

      const savedStats = localStorage.getItem(STORAGE_KEY_STATS);
      if (savedStats) {
        setSessionStats(JSON.parse(savedStats));
      }

      const savedVoice = localStorage.getItem(STORAGE_KEY_VOICE);
      if (savedVoice) {
        setVoiceNotes(JSON.parse(savedVoice));
      }
    } catch (e) {
      console.warn('Error reading from storage:', e);
      setCurrentIssues(initialIssues);
    }

    setBrokerQueue([
      {
        id: `q-${Date.now()}`,
        timestamp: Date.now() - 5000,
        frameThumbnail: '',
        issueCount: initialIssues.length,
        status: 'buffered',
        issues: initialIssues,
      },
    ]);

    fetchCjm();

    // Subscribe to real-time voice notes
    const unsubscribeVoice = voiceDictation.subscribe((note) => {
      setVoiceNotes((prev) => [...prev.slice(-19), note]);
    });

    return () => {
      unsubscribeVoice();
    };
  }, []);

  // Persist issues to localStorage
  useEffect(() => {
    if (currentIssues.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_ISSUES, JSON.stringify(currentIssues));
      } catch (e) {
        console.warn('Failed saving issues:', e);
      }
    }
  }, [currentIssues]);

  // Persist stats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(sessionStats));
    } catch (e) {
      console.warn('Failed saving stats:', e);
    }
  }, [sessionStats]);

  // Persist voice notes to localStorage
  useEffect(() => {
    if (voiceNotes.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_VOICE, JSON.stringify(voiceNotes));
      } catch (e) {
        console.warn('Failed saving voice notes:', e);
      }
    }
  }, [voiceNotes]);

  // Sync BYOK custom key state in real-time
  useEffect(() => {
    const handleKeyChange = () => {
      setHasCustomKey(hasCustomApiKey());
    };
    window.addEventListener('byok-key-updated', handleKeyChange);
    return () => window.removeEventListener('byok-key-updated', handleKeyChange);
  }, []);

  // Global Keyboard Shortcuts (Escape to close modals/drawers, Ctrl+Shift+D for debug)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key closes open modals or drawers
      if (e.key === 'Escape') {
        if (isApiKeyModalOpen) {
          setIsApiKeyModalOpen(false);
          return;
        }
        if (isReportModalOpen) {
          setIsReportModalOpen(false);
          return;
        }
        if (isRefactorDrawerOpen) {
          setIsRefactorDrawerOpen(false);
          return;
        }
        if (isDebugPanelOpen) {
          setIsDebugPanelOpen(false);
          return;
        }
        if (isPrivacyModalOpen) {
          setIsPrivacyModalOpen(false);
          return;
        }
      }

      // Ctrl + Shift + D to toggle Debug Panel
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setIsDebugPanelOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isApiKeyModalOpen, isReportModalOpen, isRefactorDrawerOpen, isDebugPanelOpen, isPrivacyModalOpen]);

  const handleResetSession = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_ISSUES);
      localStorage.removeItem(STORAGE_KEY_STATS);
      localStorage.removeItem(STORAGE_KEY_VOICE);
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  // Handle new incoming issues from Edge Tier Stream Viewer
  const handleNewIssuesDetected = useCallback((issues: UxIssue[], frameDataUrl: string) => {
    setActiveFrameSnapshot(frameDataUrl);
    setCurrentIssues(issues);

    setSessionStats((prev) => {
      const newCrit = issues.filter((i) => i.severity === 'critical').length;
      return {
        ...prev,
        framesScanned: prev.framesScanned + 1,
        issuesDetected: prev.issuesDetected + issues.length,
        criticalBlockers: Math.max(prev.criticalBlockers, newCrit),
        wcagScore: Math.max(45, 95 - issues.length * 7),
      };
    });

    const newQueueItem: BrokerQueueItem = {
      id: `evt-${Date.now()}`,
      timestamp: Date.now(),
      frameThumbnail: frameDataUrl,
      issueCount: issues.length,
      status: 'buffered',
      issues,
    };
    setBrokerQueue((prev) => [newQueueItem, ...prev.slice(0, 19)]);
  }, []);

  // Handle model fallback and quota notification
  const handleModelAutoFallback = useCallback((actualModel: string, warning?: string) => {
    setLastUsedModel(actualModel);
    if (warning) {
      setLastQuotaWarning(warning);
    }
  }, []);

  // Handle Rage Click
  const handleRegisterRageClick = useCallback((x: number, y: number) => {
    setSessionStats((prev) => ({
      ...prev,
      rageClicks: prev.rageClicks + 1,
    }));
  }, []);

  // Trigger Issue Selection for Deep Refactor Drawer
  const handleSelectIssue = (issue: UxIssue, frameImg?: string) => {
    setSelectedIssue(issue);
    if (frameImg) setActiveFrameSnapshot(frameImg);
    setIsRefactorDrawerOpen(true);
  };

  // Permissions Handlers (Screen & Mic toggles)
  const handleToggleScreenPermission = (enable?: boolean) => {
    const nextState = enable !== undefined ? enable : !screenPermissionGranted;
    setScreenPermissionGranted(nextState);
    if (!nextState) {
      setPermissionRevokeCount((c) => c + 1);
    }
  };

  const handleToggleMicPermission = async (enable?: boolean) => {
    const nextState = enable !== undefined ? enable : !micPermissionGranted;
    if (nextState) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setMicPermissionGranted(true);
        voiceDictation.start();
      } catch (e) {
        console.warn('Microphone permission not granted:', e);
        setMicPermissionGranted(false);
        voiceDictation.stop();
      }
    } else {
      setMicPermissionGranted(false);
      voiceDictation.stop();
    }
  };

  const handleRevokeAllPermissions = () => {
    setScreenPermissionGranted(false);
    setMicPermissionGranted(false);
    voiceDictation.stop();
    setPermissionRevokeCount((c) => c + 1);
  };

  const handleGrantAllPermissions = async () => {
    setScreenPermissionGranted(true);
    await handleToggleMicPermission(true);
  };

  // Trigger Background Worker for Batch Processing
  const handleTriggerBatchWorker = async () => {
    setIsProcessingBatch(true);
    try {
      setBrokerQueue((prev) =>
        prev.map((item) => ({ ...item, status: 'processing_deep' }))
      );

      if (currentIssues.length > 0) {
        await authFetch('/api/audit/deep-refactor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            issue: currentIssues[0],
            framework: 'React 19 + Tailwind CSS',
            selectedModel,
          }),
        });
      }

      setBrokerQueue((prev) =>
        prev.map((item) => ({ ...item, status: 'analyzed' }))
      );
    } catch (err) {
      console.error('Batch worker failed:', err);
    } finally {
      setIsProcessingBatch(false);
    }
  };

  // Rebuild Customer Journey Map (CJM)
  const fetchCjm = async () => {
    setIsCjmLoading(true);
    try {
      const res = await authFetch('/api/audit/cjm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionEvents: currentIssues,
          sessionDurationSeconds: sessionStats.sessionDuration,
          selectedModel,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCjmData(data);
      }
    } catch (err) {
      console.error('CJM generation failed:', err);
    } finally {
      setIsCjmLoading(false);
    }
  };

  // Generate Executive Final Report
  const handleGenerateReport = async () => {
    setIsReportModalOpen(true);
    try {
      const res = await authFetch('/api/audit/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allIssues: currentIssues,
          sessionStats,
          cjmData,
          selectedModel,
          voiceNotes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReportMarkdown(data.reportMarkdown);
      }
    } catch (err) {
      console.error('Report generation failed:', err);
    }
  };

  // Filtered issues for sidebar
  const filteredIssues = currentIssues.filter((i) => {
    if (issueFilter === 'critical') return i.severity === 'critical';
    if (issueFilter === 'wcag_a11y') return i.category === 'wcag_a11y';
    if (issueFilter === 'touch_target') return i.category === 'touch_target';
    if (issueFilter === 'ux_deadend') return i.category === 'ux_deadend';
    return true;
  });

  const criticalCount = currentIssues.filter((i) => i.severity === 'critical').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={handleGenerateReport}
        onOpenDebugPanel={() => setIsDebugPanelOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasCustomKey={hasCustomKey}
        issuesCount={currentIssues.length}
        criticalCount={criticalCount}
        onRevokeAllPermissions={handleRevokeAllPermissions}
        onOpenPermissionsModal={() => setIsPrivacyModalOpen(true)}
        screenPermissionGranted={screenPermissionGranted}
        micPermissionGranted={micPermissionGranted}
        selectedModel={selectedModel}
        lastUsedModel={lastUsedModel}
        hasQuotaWarning={Boolean(lastQuotaWarning)}
      />

      {/* Global Quota Exhaustion Circuit-Breaker Banner */}
      {lastQuotaWarning && (
        <div className="bg-amber-950/90 border-b border-amber-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-200 z-30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Повідомлення системи квот:</strong> {lastQuotaWarning}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedModel('gemini-3.1-flash-lite');
                setLastQuotaWarning(null);
              }}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition-colors"
            >
              Увімкнути Gemini 3.1 Flash Lite
            </button>
            <button
              onClick={() => setIsDebugPanelOpen(true)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors"
            >
              Відкрити Debug Panel
            </button>
            <button
              onClick={() => setLastQuotaWarning(null)}
              className="p-1 rounded text-amber-300 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {activeTab === 'stream_hud' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[600px]">
            {/* Left Main: Live Stream & HUD Viewer (8 cols) */}
            <div className="lg:col-span-8 flex flex-col">
              <EdgeTierStreamViewer
                key={permissionRevokeCount}
                currentIssues={currentIssues}
                onSelectIssue={(issue) => handleSelectIssue(issue)}
                onNewIssuesDetected={handleNewIssuesDetected}
                onRegisterRageClick={handleRegisterRageClick}
                activeScenarioName={activeScenarioName}
                setActiveScenarioName={setActiveScenarioName}
                selectedModel={selectedModel}
                onModelAutoFallback={handleModelAutoFallback}
                screenPermissionGranted={screenPermissionGranted}
                micPermissionGranted={micPermissionGranted}
                onToggleScreenPermission={handleToggleScreenPermission}
                onToggleMicPermission={handleToggleMicPermission}
                onRevokeAllPermissions={handleRevokeAllPermissions}
                onOpenPermissionsModal={() => setIsPrivacyModalOpen(true)}
                voiceNotes={voiceNotes}
                onAddVoiceNote={(text) => voiceDictation.addManualNote(text)}
              />
            </div>

            {/* Right Panel: Live Flaw Stream & Action Bar (4 cols) */}
            <div className="lg:col-span-4 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl isolate">
              {/* Panel Top */}
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Потік аномалій у реальному часі
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Натисніть «Рефакторинг», щоб згенерувати код
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleResetSession}
                    title="Скинути локальну сесію та оновити"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-slate-800 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setIsDebugPanelOpen(true)}
                    title="Модель ШІ та квоти (Хоткей: Ctrl+Shift+D, закриття: Esc)"
                    className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 transition-colors"
                  >
                    {selectedModel}
                  </button>
                </div>
              </div>

              {/* Filter chips */}
              <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <button
                  onClick={() => setIssueFilter('all')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    issueFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Всі ({currentIssues.length})
                </button>
                <button
                  onClick={() => setIssueFilter('critical')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    issueFilter === 'critical' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Критичні ({criticalCount})
                </button>
                <button
                  onClick={() => setIssueFilter('touch_target')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    issueFilter === 'touch_target' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Тач-зони
                </button>
                <button
                  onClick={() => setIssueFilter('wcag_a11y')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    issueFilter === 'wcag_a11y' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  WCAG
                </button>
              </div>

              {/* Issues List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[500px]">
                {filteredIssues.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Немає активних аномалій у цій категорії.
                  </div>
                ) : (
                  filteredIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-3.5 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-indigo-500/60 transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          issue.severity === 'critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          issue.severity === 'high' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        }`}>
                          {issue.severity}
                        </span>
                        {issue.wcagRule && (
                          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[160px]">
                            {issue.wcagRule}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors leading-snug">
                        {issue.title}
                      </h4>

                      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                        {issue.explanation}
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                        <span className="text-[10px] font-mono text-emerald-400 truncate max-w-[170px]">
                          {issue.quickFix}
                        </span>
                        <button
                          onClick={() => handleSelectIssue(issue)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-300 group-hover:text-white text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          Рефакторинг
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Telemetry Bar */}
              <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <MousePointerClick className="w-3.5 h-3.5 text-rose-400" />
                  <span>Rage Clicks: <strong className="text-slate-200">{sessionStats.rageClicks}</strong></span>
                </div>
                <button
                  onClick={handleGenerateReport}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Повний баг-репорт
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Multimodal Photo Upload & Reverse Engineering */}
        {activeTab === 'photo_upload' && (
          <div className="flex-1">
            <PhotoUploadAuditor
              onIssueSelectedForDeepRefactor={(issue, img) => handleSelectIssue(issue, img)}
              selectedModel={selectedModel}
              onOpenDebugPanel={() => setIsDebugPanelOpen(true)}
            />
          </div>
        )}

        {/* Tab 3: Async Broker Pipeline & Queue */}
        {activeTab === 'broker_queue' && (
          <div className="flex-1">
            <BrokerQueueInspector
              queueItems={brokerQueue}
              onTriggerBatchWorker={handleTriggerBatchWorker}
              isProcessingBatch={isProcessingBatch}
              onSelectIssue={(issue) => handleSelectIssue(issue)}
            />
          </div>
        )}

        {/* Tab 4: Customer Journey Map (CJM) & Friction Points */}
        {activeTab === 'cjm_flow' && (
          <div className="flex-1">
            <CjmGraphView
              cjmData={cjmData}
              onRefreshCjm={fetchCjm}
              isLoading={isCjmLoading}
            />
          </div>
        )}
      </main>

      {/* Debug & Model Selection Panel */}
      <DebugPanel
        isOpen={isDebugPanelOpen}
        onClose={() => setIsDebugPanelOpen(false)}
        selectedModel={selectedModel}
        onSelectModel={(m) => {
          setSelectedModel(m);
          setLastQuotaWarning(null);
        }}
        lastUsedModel={lastUsedModel}
        lastQuotaWarning={lastQuotaWarning}
      />

      {/* Permissions & Privacy Management Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-950 border border-indigo-700/60 rounded-xl text-indigo-400">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Селектор дозволів та конфіденційність
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Керування доступом до захоплення екрана та мікрофона
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Quick Master Controls */}
              <div className="flex items-center justify-between gap-2 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-300">
                  Швидкі загальні дії:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRevokeAllPermissions}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 transition-all shadow-sm"
                  >
                    <ShieldOff className="w-3.5 h-3.5 text-rose-400" />
                    <span>Відкликати всі дозволи</span>
                  </button>
                  <button
                    onClick={handleGrantAllPermissions}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-800 transition-all shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Увімкнути всі дозволи</span>
                  </button>
                </div>
              </div>

              {/* Granular Permission Toggles */}
              <div className="space-y-3">
                {/* 1. Screen Capture Toggle */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  screenPermissionGranted 
                    ? 'bg-slate-950 border-emerald-900/60 ring-1 ring-emerald-500/20' 
                    : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl border mt-0.5 ${
                        screenPermissionGranted 
                          ? 'bg-emerald-950/50 border-emerald-800 text-emerald-400' 
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        <Monitor className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-200 text-sm">
                            Захоплення екрана (Display Capture)
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                            screenPermissionGranted
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${screenPermissionGranted ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                            {screenPermissionGranted ? 'УВІМКНЕНО / ДОЗВОЛЕНО' : 'ВІДКЛИКАНО / ВИМКНЕНО'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Перегляд потоку прототипів Figma / Expo / вікон браузера у реальному часі для мультимодального аудиту UX.
                        </p>
                      </div>
                    </div>

                    {/* Interactive Switch */}
                    <div className="shrink-0 flex items-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={screenPermissionGranted}
                        onClick={() => handleToggleScreenPermission()}
                        title={screenPermissionGranted ? 'Вимкнути дозвіл на захоплення екрана' : 'Увімкнути дозвіл на захоплення екрана'}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          screenPermissionGranted ? 'bg-emerald-600' : 'bg-slate-700'
                        }`}
                      >
                        <span className="sr-only">Перемикач дозволу на екран</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            screenPermissionGranted ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Quick Toggle Actions */}
                  <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Статус: {screenPermissionGranted ? 'Потік екрана активний' : 'Доступ повністю перекрито'}</span>
                    <button
                      onClick={() => handleToggleScreenPermission()}
                      className={`font-semibold transition-colors ${
                        screenPermissionGranted 
                          ? 'text-rose-400 hover:text-rose-300' 
                          : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      {screenPermissionGranted ? 'Відкликати дозвіл' : 'Увімкнути дозвіл'}
                    </button>
                  </div>
                </div>

                {/* 2. Microphone Toggle */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  micPermissionGranted 
                    ? 'bg-slate-950 border-emerald-900/60 ring-1 ring-emerald-500/20' 
                    : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl border mt-0.5 ${
                        micPermissionGranted 
                          ? 'bg-emerald-950/50 border-emerald-800 text-emerald-400' 
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        {micPermissionGranted ? (
                          <Mic className="w-4 h-4" />
                        ) : (
                          <MicOff className="w-4 h-4" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-200 text-sm">
                            Дозвіл на мікрофон / аудіо
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                            micPermissionGranted
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${micPermissionGranted ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                            {micPermissionGranted ? 'УВІМКНЕНО / ДОЗВОЛЕНО' : 'ВІДКЛИКАНО (БЕЗ ДОСТУПУ)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Прослуховування або аудіо-потоки пристрою для аналізу голосових коментарів і реакцій користувача під час тестування.
                        </p>
                      </div>
                    </div>

                    {/* Interactive Switch */}
                    <div className="shrink-0 flex items-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={micPermissionGranted}
                        onClick={() => handleToggleMicPermission()}
                        title={micPermissionGranted ? 'Вимкнути дозвіл на мікрофон' : 'Увімкнути дозвіл на мікрофон'}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          micPermissionGranted ? 'bg-emerald-600' : 'bg-slate-700'
                        }`}
                      >
                        <span className="sr-only">Перемикач дозволу на мікрофон</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            micPermissionGranted ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Quick Toggle Actions */}
                  <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Статус: {micPermissionGranted ? 'Мікрофон увімкнено' : 'Аудіотрек вимкнено'}</span>
                    <button
                      onClick={() => handleToggleMicPermission()}
                      className={`font-semibold transition-colors ${
                        micPermissionGranted 
                          ? 'text-rose-400 hover:text-rose-300' 
                          : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      {micPermissionGranted ? 'Відкликати дозвіл' : 'Увімкнути дозвіл'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Security & User Control Guarantee */}
              <div className="p-3.5 bg-indigo-950/20 border border-indigo-800/40 rounded-2xl text-indigo-300 text-[11px] leading-relaxed">
                ✓ <strong>Повний суверенітет користувача:</strong> Ви можете у будь-який момент увімкнути або відкликати окремі чи всі дозволи. При відкликанні всі системні медіа-треки миттєво зупиняються на рівні браузера (<code className="text-indigo-200 font-mono">MediaStreamTrack.stop()</code>), а фонові слухачі очищуються.
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md"
              >
                Зберегти та закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deep Refactor Drawer (Background Tier) */}
      <DeepRefactorDrawer
        isOpen={isRefactorDrawerOpen}
        onClose={() => setIsRefactorDrawerOpen(false)}
        issue={selectedIssue}
        frameSnapshot={activeFrameSnapshot}
        selectedModel={selectedModel}
        onOpenDebugPanel={() => setIsDebugPanelOpen(true)}
      />

      {/* Executive Report Modal */}
      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportMarkdown={reportMarkdown}
        allIssues={currentIssues}
        sessionStats={sessionStats}
        cjmData={cjmData}
        voiceNotes={voiceNotes}
      />

      {/* Bring Your Own Key (BYOK) Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyChanged={() => setHasCustomKey(hasCustomApiKey())}
      />
    </div>
  );
}
