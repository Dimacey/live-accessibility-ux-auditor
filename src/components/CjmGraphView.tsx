import React, { useState } from 'react';
import { 
  GitFork, 
  Sparkles, 
  AlertTriangle, 
  MousePointerClick, 
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { CjmData, CjmStep } from '../types/auditor';

interface CjmGraphViewProps {
  cjmData: CjmData | null;
  onRefreshCjm: () => void;
  isLoading: boolean;
}

export const CjmGraphView: React.FC<CjmGraphViewProps> = ({
  cjmData,
  onRefreshCjm,
  isLoading,
}) => {
  const [selectedStep, setSelectedStep] = useState<CjmStep | null>(null);

  const activeStep = selectedStep || (cjmData?.steps?.[0] ?? null);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950 border border-indigo-700/60 rounded-xl text-indigo-400">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Автоматична побудова CJM (Customer Journey Map)
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                UX Research & Session Replays
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Відновлення користувацького шляху та точок тертя (Friction Points) за відеопотоком
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshCjm}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Синтез CJM...' : 'Перебудувати карту шляху'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Metric Cards Row */}
        {cjmData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Оцінка успішності (Completion Rate)</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {cjmData.completionRateEstimated}%
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Прогноз успішного завершення цільової дії</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Індекс загального тертя (Total Friction)</div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {cjmData.totalFrictionScore}/100
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Рівень когнітивного та моторного навантаження</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-medium">Сценарій сесії</div>
              <div className="text-sm font-bold text-slate-200 mt-2 truncate">
                {cjmData.flowName}
              </div>
              <div className="text-[10px] text-indigo-400 mt-1">Кроків у ланцюжку: {cjmData.steps.length}</div>
            </div>
          </div>
        )}

        {/* Visual Graph Nodes */}
        {cjmData?.steps && (
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center justify-between">
              <span>Граф переходів та точки відтоку (Friction Flow)</span>
              <span className="text-[11px] text-slate-500">Натисніть на крок для деталей</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cjmData.steps.map((step) => {
                const isSelected = activeStep?.stepIndex === step.stepIndex;
                const isFriction = step.status === 'friction';
                const isBlocked = step.status === 'blocked';

                const borderCls = isBlocked
                  ? 'border-rose-600/80 bg-rose-950/20'
                  : isFriction
                  ? 'border-amber-600/80 bg-amber-950/20'
                  : 'border-emerald-600/80 bg-emerald-950/20';

                return (
                  <div
                    key={step.stepIndex}
                    onClick={() => setSelectedStep(step)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${borderCls} ${
                      isSelected ? 'ring-2 ring-indigo-400 scale-[1.02] shadow-xl' : 'hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        КРОК {step.stepIndex}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        isBlocked ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        isFriction ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {step.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-100 mb-1 leading-snug">
                      {step.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {step.userIntent}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-slate-400">
                        <MousePointerClick className="w-3 h-3 text-rose-400" />
                        Rage clicks: <strong className="text-slate-200">{step.rageClickCount}</strong>
                      </span>
                      <span className={`font-semibold ${
                        step.dropOffRisk === 'high' ? 'text-rose-400' :
                        step.dropOffRisk === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        Ризик відтоку: {step.dropOffRisk}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Step Deep Dive Inspector */}
        {activeStep && (
          <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-900/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">
                  Детальний аналіз кроку #{activeStep.stepIndex}
                </span>
                <h3 className="text-sm font-bold text-slate-100 mt-0.5">{activeStep.name}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Мета користувача:</span>
                <div className="text-xs font-semibold text-slate-200">{activeStep.userIntent}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Точки тертя (Friction Diagnostics)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeStep.frictionDetails}
                </p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Рекомендація щодо оптимізації конверсії
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeStep.recommendation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Executive Advice Summary */}
        {cjmData?.executiveAdvice && (
          <div className="p-4 bg-indigo-950/30 border border-indigo-800/50 rounded-xl flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-200 leading-relaxed">
              <strong className="text-indigo-100 block mb-1 font-semibold">
                Висновки UX-дослідника
              </strong>
              {cjmData.executiveAdvice}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
