import React from 'react';
import { 
  Database, 
  ArrowRight, 
  Zap, 
  Cpu, 
  PlayCircle,
  Activity
} from 'lucide-react';
import { BrokerQueueItem, UxIssue } from '../types/auditor';

interface BrokerQueueInspectorProps {
  queueItems: BrokerQueueItem[];
  onTriggerBatchWorker: () => void;
  isProcessingBatch: boolean;
  onSelectIssue: (issue: UxIssue) => void;
}

export const BrokerQueueInspector: React.FC<BrokerQueueInspectorProps> = ({
  queueItems,
  onTriggerBatchWorker,
  isProcessingBatch,
  onSelectIssue,
}) => {
  const bufferedCount = queueItems.filter((q) => q.status === 'buffered').length;

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950 border border-indigo-700/60 rounded-xl text-indigo-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Архітектура з асинхронним брокером (Async Broker Pipeline)
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full">
                Active Queue: {queueItems.length} подій
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Розділення швидкого контуру екрана (Edge Tier) та важкого контуру рефакторингу (Background Tier)
            </p>
          </div>
        </div>

        <button
          onClick={onTriggerBatchWorker}
          disabled={isProcessingBatch || bufferedCount === 0}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
        >
          <PlayCircle className={`w-4 h-4 ${isProcessingBatch ? 'animate-spin' : ''}`} />
          {isProcessingBatch ? 'Обробка пакета воркером...' : `Обробити пакет (${bufferedCount} у черзі)`}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Interactive Architecture Flow Diagram */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Топологія передачі відеопотоку та подій</span>
            <span className="text-[11px] text-indigo-400 font-mono">Zero-Latency Decoupling</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            {/* Stage 1: Edge Tier */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Edge Tier (Реальний час)
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                  ~180ms
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Прямий відеопотік екрана (Figma, Expo Go, Web). Миттєвий скан кадрів, червоні зони та запис у буфер.
              </p>
              <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/40">
                Модель: gemini-3.8-flash (Live Stream)
              </div>
            </div>

            {/* Stage 2: Broker Queue */}
            <div className="bg-slate-900 p-4 rounded-xl border border-indigo-900/60 flex flex-col justify-between relative overflow-hidden ring-1 ring-indigo-500/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  Message Broker (Queue)
                </span>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                  {bufferedCount} pending
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Асинхронний буфер подій: зберігає знімки екранів, дельти кліків, таймінги та координати аномалій без просідання FPS.
              </p>
              <div className="text-[11px] font-mono text-indigo-400 bg-indigo-950/40 p-2 rounded-lg border border-indigo-900/40">
                Буфер: Local In-Memory / Redis Queue
              </div>
            </div>

            {/* Stage 3: Background Tier */}
            <div className="bg-slate-900 p-4 rounded-xl border border-purple-900/60 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  Background Tier (Worker)
                </span>
                <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                  High Thinking
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Забирає пакети подій із черги, підтягує контекст і формує архітектурно вивірені патчі коду.
              </p>
              <div className="text-[11px] font-mono text-purple-400 bg-purple-950/40 p-2 rounded-lg border border-purple-900/40">
                Модель: gemini-4-argon (ThinkingLevel.HIGH)
              </div>
            </div>
          </div>
        </div>

        {/* Live Event Stream Log */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Журнал подій буфера (Event Stream Buffer)
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Синхронізовано · FIFO
            </span>
          </div>

          {queueItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Черга порожня. Запустіть симулятор або захоплення екрана, щоб наповнити чергу подіями.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
              {queueItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-900/50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    {item.frameThumbnail && (
                      <img
                        src={item.frameThumbnail}
                        alt="Thumbnail"
                        className="w-12 h-12 object-cover rounded-lg border border-slate-800 bg-black shrink-0"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-200">
                          Подія #{item.id.slice(-6)}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          item.status === 'analyzed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : item.status === 'processing_deep'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800 animate-pulse'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Виявлено {item.issues.length} аномалій · {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {item.issues.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectIssue(item.issues[0])}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1 transition-colors"
                      >
                        Інспектувати
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
