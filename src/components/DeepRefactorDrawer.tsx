import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Code2, 
  Check, 
  Copy, 
  Terminal,
  Download
} from 'lucide-react';
import { UxIssue, DeepRefactorResult } from '../types/auditor';
import { authFetch } from '../utils/apiClient';

interface DeepRefactorDrawerProps {
  issue: UxIssue | null;
  onClose: () => void;
  isOpen: boolean;
  frameSnapshot?: string | null;
  selectedModel?: string;
  onOpenDebugPanel?: () => void;
}

export const DeepRefactorDrawer: React.FC<DeepRefactorDrawerProps> = ({
  issue,
  onClose,
  isOpen,
  frameSnapshot,
  selectedModel = 'auto',
  onOpenDebugPanel,
}) => {
  const [selectedFramework, setSelectedFramework] = useState<string>('React 19 + Tailwind CSS');
  const [isRefactoring, setIsRefactoring] = useState<boolean>(false);
  const [refactorData, setRefactorData] = useState<DeepRefactorResult | null>(null);
  const [copiedAfter, setCopiedAfter] = useState<boolean>(false);
  const [copiedTest, setCopiedTest] = useState<boolean>(false);
  const [copiedFigma, setCopiedFigma] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'diff' | 'architecture' | 'test'>('diff');

  // Load deep refactor on issue change
  useEffect(() => {
    if (!issue || !isOpen) return;

    let isMounted = true;
    const fetchDeepRefactor = async () => {
      setIsRefactoring(true);
      setRefactorData(null);

      try {
        const res = await authFetch('/api/audit/deep-refactor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            issue,
            imageBase64: frameSnapshot || issue.frameSnapshot,
            framework: selectedFramework,
            selectedModel,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) setRefactorData(data);
        }
      } catch (err) {
        console.error('Deep refactor request failed:', err);
      } finally {
        if (isMounted) setIsRefactoring(false);
      }
    };

    fetchDeepRefactor();
    return () => {
      isMounted = false;
    };
  }, [issue, isOpen, selectedFramework, frameSnapshot, selectedModel]);

  if (!isOpen || !issue) return null;

  const copyToClipboard = (text: string, type: 'after' | 'test') => {
    navigator.clipboard.writeText(text);
    if (type === 'after') {
      setCopiedAfter(true);
      setTimeout(() => setCopiedAfter(false), 2000);
    } else {
      setCopiedTest(true);
      setTimeout(() => setCopiedTest(false), 2000);
    }
  };

  const handleDownloadSingleTest = () => {
    if (!refactorData) return;
    const testContent = `import { test, expect } from '@playwright/test';\n\n${refactorData.testSnippet}\n`;
    const blob = new Blob([testContent], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${issue.id}-a11y-test.spec.ts`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyFigmaSingle = () => {
    const figmaNote = [
      `📌 FIGMA UX ANNOTATION STICKY NOTE`,
      `Дефект: [${issue.severity.toUpperCase()}] ${issue.title}`,
      `Норма: ${issue.wcagRule || 'Nielsen Norman UX'}`,
      `Координати: X: ${issue.boundingBox.x}%, Y: ${issue.boundingBox.y}% (${issue.boundingBox.width}% x ${issue.boundingBox.height}%)`,
      `Проблема: ${issue.explanation}`,
      `Рішення: ${issue.quickFix}`,
      `Архітектура: ${refactorData?.architecturalAdvice || ''}`,
    ].join('\n');
    navigator.clipboard.writeText(figmaNote);
    setCopiedFigma(true);
    setTimeout(() => setCopiedFigma(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950 border border-indigo-700/60 rounded-xl text-indigo-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                Background Tier · Deep Refactor
              </span>
              <button
                onClick={onOpenDebugPanel}
                title="Натисніть для зміни моделі ШІ у Debug Panel"
                className="bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>{(refactorData as any)?.actualModel || selectedModel}</span>
              </button>
            </div>
            <h2 className="text-sm font-bold text-slate-200 mt-1 line-clamp-1">{issue.title}</h2>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Target Framework & Mode Selector */}
      <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Стек проєкту:</span>
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none"
          >
            <option value="React 19 + Tailwind CSS">React 19 + Tailwind CSS</option>
            <option value="React Native + Expo">React Native + Expo</option>
            <option value="Vue 3 + Tailwind CSS">Vue 3 + Tailwind CSS</option>
            <option value="HTML5 + Accessible ARIA">HTML5 + Accessible ARIA</option>
          </select>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('diff')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'diff' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Before / After Diff
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'architecture' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Архітектура & WCAG
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'test' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Playwright a11y тест
          </button>
        </div>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Issue Banner */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
              issue.severity === 'critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
              issue.severity === 'high' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
              'bg-indigo-950 text-indigo-300 border border-indigo-800'
            }`}>
              {issue.severity}
            </span>
            {issue.wcagRule && (
              <span className="text-[11px] font-mono text-indigo-400">
                {issue.wcagRule}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{issue.explanation}</p>
          <div className="text-[11px] text-emerald-400 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-900/40">
            <strong>Швидке рішення:</strong> {issue.quickFix}
          </div>
        </div>

        {/* Loading state with Thinking animation */}
        {isRefactoring && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
            <h4 className="text-sm font-bold text-slate-200">
              Фоновий воркер виконує глибокий рефакторинг...
            </h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Модель <strong>gemini-4-argon</strong> задіює ThinkingLevel.HIGH для аналізу структури компонентів, синтезу ARIA-тегів та ергономіки тач-зон.
            </p>
          </div>
        )}

        {/* Tab 1: Side by Side Diff */}
        {!isRefactoring && refactorData && activeTab === 'diff' && (
          <div className="space-y-4">
            {/* Before (Flawed) */}
            <div className="rounded-2xl border border-rose-900/50 bg-slate-950 overflow-hidden">
              <div className="px-4 py-2 bg-rose-950/40 border-b border-rose-900/40 flex items-center justify-between text-xs font-semibold text-rose-300">
                <span>❌ Було (Код із дефектом)</span>
                <span className="text-[10px] font-mono text-rose-400">Уразливість верстки/UX</span>
              </div>
              <pre className="p-4 text-xs font-mono text-rose-200/90 overflow-x-auto bg-slate-950 leading-relaxed">
                <code>{refactorData.beforeCode || '// Код вихідного елемента'}</code>
              </pre>
            </div>

            {/* After (Clean, Accessible) */}
            <div className="rounded-2xl border border-emerald-900/50 bg-slate-950 overflow-hidden shadow-xl">
              <div className="px-4 py-2 bg-emerald-950/40 border-b border-emerald-900/40 flex items-center justify-between text-xs font-semibold text-emerald-300">
                <span>✅ Стало (Виправлений код із WCAG & a11y)</span>
                <button
                  onClick={() => copyToClipboard(refactorData.afterCode, 'after')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-medium transition-colors"
                >
                  {copiedAfter ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedAfter ? 'Скопійовано!' : 'Скопіювати патч'}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-200 overflow-x-auto bg-slate-950 leading-relaxed max-h-80">
                <code>{refactorData.afterCode}</code>
              </pre>
            </div>

            {refactorData.explanation && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <strong className="text-slate-100 block mb-1">Обґрунтування змін:</strong>
                {refactorData.explanation}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Architectural Advice */}
        {!isRefactoring && refactorData && activeTab === 'architecture' && (
          <div className="space-y-4">
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Архітектурне рішення патерна
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {refactorData.architecturalAdvice}
              </p>
            </div>

            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Специфікація стандартів доступності
              </h4>
              <div className="text-xs text-slate-300 font-mono">
                {refactorData.wcagReference}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {refactorData.diagnosis}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Playwright / Vitest snippet */}
        {!isRefactoring && refactorData && activeTab === 'test' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
              <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5 font-mono">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  Автотест регресії (Playwright / axe-core)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDownloadSingleTest}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-200 text-xs font-medium transition-colors"
                    title="Завантажити Playwright тест як файл .spec.ts"
                  >
                    <Download className="w-3 h-3 text-purple-400" />
                    <span>.spec.ts</span>
                  </button>

                  <button
                    onClick={handleCopyFigmaSingle}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 text-xs font-medium transition-colors"
                    title="Копіювати стікер для Figma"
                  >
                    {copiedFigma ? <Check className="w-3 h-3 text-emerald-400" /> : <Sparkles className="w-3 h-3 text-indigo-400" />}
                    <span>{copiedFigma ? 'Скопійовано!' : 'Figma'}</span>
                  </button>

                  <button
                    onClick={() => copyToClipboard(refactorData.testSnippet, 'test')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    {copiedTest ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedTest ? 'Скопійовано!' : 'Копіювати'}
                  </button>
                </div>
              </div>
              <pre className="p-4 text-xs font-mono text-indigo-300 overflow-x-auto bg-slate-950 leading-relaxed max-h-96">
                <code>{refactorData.testSnippet || '// Тест доступності елемента'}</code>
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-mono text-[11px]">
          JSON Patch Ready · Zero Code Collision
        </span>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors"
        >
          Закрити інспектор
        </button>
      </div>
    </div>
  );
};
