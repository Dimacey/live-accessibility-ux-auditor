import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Monitor, 
  Pause, 
  Play, 
  Scan, 
  Volume2, 
  VolumeX, 
  Cpu,
  ShieldOff,
  ShieldCheck,
  Mic,
  MicOff,
  AlertOctagon,
  RefreshCw,
  Plus,
  MessageSquare,
  Eye,
  EyeOff
} from 'lucide-react';
import { UxIssue, VoiceNote } from '../types/auditor';
import { InteractiveSandbox } from './InteractiveSandbox';
import { audioAlert } from '../utils/audioAlert';
import { authFetch } from '../utils/apiClient';

interface EdgeTierStreamViewerProps {
  currentIssues: UxIssue[];
  onSelectIssue: (issue: UxIssue) => void;
  onNewIssuesDetected: (issues: UxIssue[], frameDataUrl: string) => void;
  onRegisterRageClick: (x: number, y: number) => void;
  activeScenarioName: string;
  setActiveScenarioName: (name: string) => void;
  selectedModel?: string;
  onModelAutoFallback?: (actualModel: string, warning?: string) => void;
  screenPermissionGranted?: boolean;
  micPermissionGranted?: boolean;
  onToggleScreenPermission?: (granted: boolean) => void;
  onToggleMicPermission?: (granted: boolean) => void;
  onRevokeAllPermissions?: () => void;
  onOpenPermissionsModal?: () => void;
  voiceNotes?: VoiceNote[];
  onAddVoiceNote?: (text: string) => void;
}

export const EdgeTierStreamViewer: React.FC<EdgeTierStreamViewerProps> = ({
  currentIssues,
  onSelectIssue,
  onNewIssuesDetected,
  onRegisterRageClick,
  activeScenarioName,
  setActiveScenarioName,
  selectedModel = 'auto',
  onModelAutoFallback,
  screenPermissionGranted = true,
  micPermissionGranted = false,
  onToggleScreenPermission,
  onToggleMicPermission,
  onRevokeAllPermissions,
  onOpenPermissionsModal,
  voiceNotes = [],
  onAddVoiceNote,
}) => {
  const [sourceMode, setSourceMode] = useState<'sandbox' | 'screenshare'>('sandbox');
  const [isAuditing, setIsAuditing] = useState<boolean>(true);
  const [scanIntervalMs] = useState<number>(3000);
  const [isScanningNow, setIsScanningNow] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedOverlayIssueId, setSelectedOverlayIssueId] = useState<string | null>(null);
  const [showHudOverlay, setShowHudOverlay] = useState<boolean>(true);

  // Permissions state
  const [screenPermissionStatus, setScreenPermissionStatus] = useState<'granted' | 'revoked' | 'prompt'>('prompt');
  const [micPermissionStatus, setMicPermissionStatus] = useState<'revoked' | 'inactive'>('revoked');
  const [showPermissionRevokedBanner, setShowPermissionRevokedBanner] = useState<boolean>(false);

  // Rage click coordinates to flash on HUD
  const [ragePings, setRagePings] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const sandboxContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle Rage Click
  const handleRageClick = useCallback((x: number, y: number) => {
    onRegisterRageClick(x, y);
    audioAlert.playAlert('rage');
    const newPing = { id: Date.now(), x, y };
    setRagePings((prev) => [...prev.slice(-4), newPing]);
    setTimeout(() => {
      setRagePings((prev) => prev.filter((p) => p.id !== newPing.id));
    }, 2500);
  }, [onRegisterRageClick]);

  // Start Screen Share via getDisplayMedia
  const startScreenShare = async () => {
    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: false,
      });
      screenStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setSourceMode('screenshare');
      setScreenPermissionStatus('granted');
      setShowPermissionRevokedBanner(false);

      stream.getVideoTracks()[0].onended = () => {
        revokeAllPermissions();
      };
    } catch (err: any) {
      console.warn('Screen share canceled or failed:', err);
    }
  };

  // REVOKE PERMISSIONS EXPLICIT ACTION
  const revokeAllPermissions = useCallback(() => {
    // 1. Stop all screen capture tracks immediately
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      screenStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // 2. Mute / revoke any audio/mic contexts
    setMicPermissionStatus('revoked');
    setScreenPermissionStatus('revoked');
    setSourceMode('sandbox');
    setShowPermissionRevokedBanner(true);

    audioAlert.playAlert('warning');
  }, []);

  // Helper to capture current frame as JPEG base64
  const captureCurrentFrame = useCallback((): string | null => {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (sourceMode === 'screenshare' && videoRef.current && videoRef.current.videoWidth > 0) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    }

    if (sourceMode === 'sandbox' && sandboxContainerRef.current) {
      const rect = sandboxContainerRef.current.getBoundingClientRect();
      canvas.width = Math.max(360, rect.width);
      canvas.height = Math.max(540, rect.height);

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0f172a';
      ctx.roundRect(20, 20, canvas.width - 40, canvas.height - 40, 24);
      ctx.fill();

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`Scenario: ${activeScenarioName}`, 40, 60);

      ctx.fillStyle = '#64748b';
      ctx.font = '12px monospace';
      ctx.fillText(`Audited at: ${new Date().toISOString()}`, 40, 85);

      return canvas.toDataURL('image/jpeg', 0.85);
    }

    return null;
  }, [sourceMode, activeScenarioName]);

  // Execute Edge Tier Frame Audit
  const triggerScan = useCallback(async () => {
    if (isScanningNow) return;
    setIsScanningNow(true);

    try {
      const frameDataUrl = captureCurrentFrame();
      if (!frameDataUrl) {
        setIsScanningNow(false);
        return;
      }

      const res = await authFetch('/api/audit/stream-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: frameDataUrl,
          scenarioContext: `Active mode: ${sourceMode}, scenario: ${activeScenarioName}`,
          viewport: { width: 375, height: 667 },
          selectedModel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.quotaWarning || data.actualModel) {
          onModelAutoFallback?.(data.actualModel, data.quotaWarning);
        }
        if (data.issues && data.issues.length > 0) {
          onNewIssuesDetected(data.issues, frameDataUrl);
          const hasCritical = data.issues.some((i: UxIssue) => i.severity === 'critical');
          audioAlert.playAlert(hasCritical ? 'critical' : 'warning');
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanningNow(false);
    }
  }, [isScanningNow, captureCurrentFrame, sourceMode, activeScenarioName, selectedModel, onModelAutoFallback, onNewIssuesDetected]);

  // Periodic Audit Loop
  useEffect(() => {
    if (!isAuditing) return;
    const interval = setInterval(() => {
      triggerScan();
    }, scanIntervalMs);
    return () => clearInterval(interval);
  }, [isAuditing, scanIntervalMs, triggerScan]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioAlert.setEnabled(next);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative isolate">
      {/* Permission Revoked Banner */}
      {showPermissionRevokedBanner && (
        <div className="bg-amber-950/90 border-b border-amber-800/80 px-4 py-2 flex items-center justify-between text-xs text-amber-200 animate-in slide-in-from-top duration-200 z-40">
          <div className="flex items-center gap-2">
            <ShieldOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Доступ відкликано:</strong> Захоплення екрана та пристроїв повністю зупинено. Всі медіа-потоки закрито.
            </span>
          </div>
          <button
            onClick={() => setShowPermissionRevokedBanner(false)}
            className="text-[10px] bg-amber-900/60 hover:bg-amber-800 px-2 py-0.5 rounded text-amber-100 transition-colors"
          >
            Зрозуміло
          </button>
        </div>
      )}

      {/* Top Stream Control HUD */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`flex h-2.5 w-2.5 rounded-full ${isAuditing ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
            <span className="text-xs font-bold text-slate-200 tracking-wide uppercase font-mono">
              Контур реального часу (Edge Tier)
            </span>
          </div>

          <span className="hidden sm:inline text-xs text-slate-500">|</span>

          {/* Source Toggle */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => {
                if (sourceMode === 'screenshare') revokeAllPermissions();
                setSourceMode('sandbox');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                sourceMode === 'sandbox' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Прототип Sandbox
            </button>
            <button
              onClick={() => {
                if (sourceMode !== 'screenshare') startScreenShare();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                sourceMode === 'screenshare' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Захоплення екрана (Figma/Expo)
            </button>
          </div>
        </div>

        {/* Live Status & Privacy Controls */}
        <div className="flex items-center gap-2">
          {/* Permissions Selector & Revoke/Enable */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={onOpenPermissionsModal}
              title="Селектор дозволів: увімкнути чи відкликати захоплення екрана та мікрофон"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                screenPermissionGranted || micPermissionGranted
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200'
                  : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300'
              }`}
            >
              {screenPermissionGranted || micPermissionGranted ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ShieldOff className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>Дозволи</span>
            </button>

            {screenPermissionGranted || micPermissionGranted ? (
              <button
                onClick={onRevokeAllPermissions || revokeAllPermissions}
                title="Відкликати всі дозволи (зупинити екран та вимкнути аудіо)"
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/80 transition-all shadow-sm"
              >
                <ShieldOff className="w-3 h-3 text-rose-400" />
                <span className="hidden sm:inline">Відкликати всі</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (onToggleScreenPermission) onToggleScreenPermission(true);
                  startScreenShare();
                }}
                title="Увімкнути захоплення екрана"
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 transition-all shadow-sm"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">Увімкнути</span>
              </button>
            )}
          </div>

          {/* HUD Overlay visibility toggle */}
          <button
            onClick={() => setShowHudOverlay(!showHudOverlay)}
            title={showHudOverlay ? 'Приховати рамки HUD оверлею' : 'Показати рамки HUD оверлею'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
              showHudOverlay
                ? 'bg-indigo-950/70 border-indigo-700/70 text-indigo-300 hover:bg-indigo-900/80 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {showHudOverlay ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">HUD</span> <span>{showHudOverlay ? 'Увімк' : 'Вимк'}</span>
          </button>

          {/* Sound alert toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Звукові сповіщення увімкнено' : 'Звук вимкнено'}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              soundEnabled
                ? 'bg-indigo-950/60 border-indigo-700/60 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Pause / Resume Live Observer */}
          <button
            onClick={() => setIsAuditing(!isAuditing)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              isAuditing
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-emerald-950 border-emerald-800 text-emerald-300'
            }`}
          >
            {isAuditing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isAuditing ? 'Пауза' : 'Відновити'}
          </button>

          {/* Manual Frame Trigger */}
          <button
            onClick={triggerScan}
            disabled={isScanningNow}
            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Scan className={`w-3.5 h-3.5 ${isScanningNow ? 'animate-spin' : ''}`} />
            {isScanningNow ? 'Скан...' : 'Скан кадру'}
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="relative flex-1 min-h-[460px] overflow-hidden flex items-center justify-center p-3 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {sourceMode === 'sandbox' ? (
          <InteractiveSandbox
            onRegisterRageClick={handleRageClick}
            sandboxContainerRef={sandboxContainerRef}
            onScenarioChange={setActiveScenarioName}
            hudOverlay={
              <div className="relative w-full h-full">
                {/* Rage click visual pulses */}
                {ragePings.map((ping) => (
                  <div
                    key={ping.id}
                    style={{ left: `${ping.x}%`, top: `${ping.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-rose-500 bg-rose-500/30 animate-ping" />
                    <div className="absolute text-[10px] font-black font-mono text-rose-300 bg-rose-950/90 px-1.5 py-0.5 rounded border border-rose-600 shadow-lg -top-6 whitespace-nowrap">
                      💥 Rage Click ({ping.x}%, {ping.y}%)
                    </div>
                  </div>
                ))}

                {/* Dynamic AI Issue Bounding Boxes */}
                {showHudOverlay && currentIssues.map((issue) => {
                  const { x, y, width, height } = issue.boundingBox;
                  const isCritical = issue.severity === 'critical';
                  const isHigh = issue.severity === 'high';
                  const isSelected = selectedOverlayIssueId === issue.id;
                  const isNearTop = y < 10;

                  const borderColor = isCritical
                    ? 'border-rose-500 bg-rose-500/10 text-rose-300'
                    : isHigh
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-indigo-500 bg-indigo-500/10 text-indigo-300';

                  return (
                    <div
                      key={issue.id}
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        width: `${Math.max(width, 10)}%`,
                        height: `${Math.max(height, 6)}%`,
                      }}
                      className={`absolute border-2 rounded-xl pointer-events-auto cursor-pointer transition-all ${borderColor} ${
                        isSelected ? 'ring-4 ring-indigo-400 scale-[1.01] shadow-2xl z-20' : 'hover:scale-[1.01]'
                      } backdrop-blur-[1px] animate-in fade-in duration-300`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOverlayIssueId(issue.id);
                        onSelectIssue(issue);
                      }}
                    >
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-current rounded-full" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-current rounded-full" />
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-current rounded-full" />
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-current rounded-full" />

                      <div className={`absolute ${isNearTop ? 'top-1.5 left-1.5' : '-top-5 left-0'} bg-slate-950/90 backdrop-blur-md px-1.5 py-0.5 rounded border border-current text-[9px] font-mono font-bold whitespace-nowrap shadow flex items-center gap-1 z-10 pointer-events-none`}>
                        <span>{isCritical ? '🚨' : '⚠️'}</span>
                        <span>{issue.title.slice(0, 24)}...</span>
                      </div>
                    </div>
                  );
                })}

                {/* Live Speech Transcription Bubble on Stream HUD */}
                {voiceNotes.length > 0 && (
                  <div className="absolute bottom-2 inset-x-2 pointer-events-auto flex justify-center animate-in slide-in-from-bottom duration-200">
                    <div className="bg-slate-950/95 border border-indigo-500/60 shadow-2xl px-3.5 py-1.5 rounded-2xl flex items-center gap-2 max-w-sm">
                      <Mic className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
                      <span className="font-mono text-[10px] text-indigo-400 shrink-0">
                        [{voiceNotes[voiceNotes.length - 1].timeFormatted}]
                      </span>
                      <span className="text-[11px] text-slate-200 truncate font-medium">
                        &ldquo;{voiceNotes[voiceNotes.length - 1].transcript}&rdquo;
                      </span>
                    </div>
                  </div>
                )}
              </div>
            }
          />
        ) : (
          <div className="relative w-full h-full max-w-4xl max-h-[560px] bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            {/* Screen share HUD overlay */}
            <div className="absolute inset-0 pointer-events-none z-20 p-4">
              <div className="relative w-full h-full">
                {ragePings.map((ping) => (
                  <div
                    key={ping.id}
                    style={{ left: `${ping.x}%`, top: `${ping.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-rose-500 bg-rose-500/30 animate-ping" />
                    <div className="absolute text-[10px] font-black font-mono text-rose-300 bg-rose-950/90 px-1.5 py-0.5 rounded border border-rose-600 shadow-lg -top-6 whitespace-nowrap">
                      💥 Rage Click ({ping.x}%, {ping.y}%)
                    </div>
                  </div>
                ))}

                {showHudOverlay && currentIssues.map((issue) => {
                  const { x, y, width, height } = issue.boundingBox;
                  const isCritical = issue.severity === 'critical';
                  const isHigh = issue.severity === 'high';
                  const isSelected = selectedOverlayIssueId === issue.id;
                  const isNearTop = y < 10;

                  const borderColor = isCritical
                    ? 'border-rose-500 bg-rose-500/10 text-rose-300'
                    : isHigh
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-indigo-500 bg-indigo-500/10 text-indigo-300';

                  return (
                    <div
                      key={issue.id}
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        width: `${Math.max(width, 10)}%`,
                        height: `${Math.max(height, 6)}%`,
                      }}
                      className={`absolute border-2 rounded-xl pointer-events-auto cursor-pointer transition-all ${borderColor} ${
                        isSelected ? 'ring-4 ring-indigo-400 scale-[1.01] shadow-2xl z-20' : 'hover:scale-[1.01]'
                      } backdrop-blur-[1px] animate-in fade-in duration-300`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOverlayIssueId(issue.id);
                        onSelectIssue(issue);
                      }}
                    >
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-current rounded-full" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-current rounded-full" />
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-current rounded-full" />
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-current rounded-full" />

                      <div className={`absolute ${isNearTop ? 'top-1.5 left-1.5' : '-top-5 left-0'} bg-slate-950/90 backdrop-blur-md px-1.5 py-0.5 rounded border border-current text-[9px] font-mono font-bold whitespace-nowrap shadow flex items-center gap-1 z-10 pointer-events-none`}>
                        <span>{isCritical ? '🚨' : '⚠️'}</span>
                        <span>{issue.title.slice(0, 24)}...</span>
                      </div>
                    </div>
                  );
                })}

                {voiceNotes.length > 0 && (
                  <div className="absolute bottom-2 inset-x-2 pointer-events-auto flex justify-center animate-in slide-in-from-bottom duration-200">
                    <div className="bg-slate-950/95 border border-indigo-500/60 shadow-2xl px-3.5 py-1.5 rounded-2xl flex items-center gap-2 max-w-sm">
                      <Mic className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
                      <span className="font-mono text-[10px] text-indigo-400 shrink-0">
                        [{voiceNotes[voiceNotes.length - 1].timeFormatted}]
                      </span>
                      <span className="text-[11px] text-slate-200 truncate font-medium">
                        &ldquo;{voiceNotes[voiceNotes.length - 1].transcript}&rdquo;
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!screenStreamRef.current && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-950/80">
                <Monitor className="w-12 h-12 text-indigo-400 mb-3 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-200">Трансляцію екрана не запущено</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Підключіть вкладку з клікабельним прототипом Figma, симулятором Expo Go або сайтом.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={startScreenShare}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/30"
                  >
                    Вибрати вікно / вкладку для стріму
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edge Tier Stream Footer Telemetry & Permissions Status */}
      <div className="bg-slate-900/95 px-4 py-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live WebSocket: <strong className="text-emerald-400">АКТИВНИЙ</strong>
          </span>

          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            Екран: <span className={sourceMode === 'screenshare' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              {sourceMode === 'screenshare' ? 'Транслюється' : 'Sandbox (Ізольовано)'}
            </span>
          </span>

          <span className="flex items-center gap-1.5 text-[11px]">
            {micPermissionGranted ? (
              <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            ) : (
              <MicOff className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>Аудіо-коментар: </span>
            <span className={micPermissionGranted ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {micPermissionGranted ? 'АКТИВНИЙ (Говоріть у мікрофон)' : 'ВІДКЛИКАНО'}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onAddVoiceNote && (
            <button
              onClick={() => {
                const sampleQuotes = [
                  'Кнопка «Назад» відсутня на екрані замовлення',
                  'Дрібний шрифт підпису умов не читається',
                  'Сенсорна зона хрестика закриття занадто мала',
                  'Клавіатура перекриває кнопку надіслати'
                ];
                const quote = sampleQuotes[Math.floor(Math.random() * sampleQuotes.length)];
                onAddVoiceNote(quote);
              }}
              title="Додати тестовий голосовий коментар тестувальника"
              className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 transition-colors"
            >
              <Plus className="w-3 h-3 text-indigo-400" />
              <span>Тест коментаря</span>
            </button>
          )}

          <button
            onClick={revokeAllPermissions}
            className="text-[11px] text-rose-400 hover:text-rose-300 underline font-sans"
          >
            Відкликати всі дозволи
          </button>
        </div>
      </div>
    </div>
  );
};
