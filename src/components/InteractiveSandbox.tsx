import React, { useState } from 'react';
import { 
  CheckCircle, 
  CreditCard, 
  Keyboard as KeyboardIcon,
  RefreshCw,
  Info,
  Smartphone
} from 'lucide-react';

export interface InteractiveSandboxProps {
  onRegisterRageClick: (x: number, y: number) => void;
  sandboxContainerRef: React.RefObject<HTMLDivElement | null>;
  onScenarioChange?: (scenarioName: string) => void;
  hudOverlay?: React.ReactNode;
}

export type SandboxScenario = 
  | 'checkout_deadend'
  | 'wcag_contrast'
  | 'mobile_keyboard_block'
  | 'i18n_overflow'
  | 'pos_kiosk';

export const InteractiveSandbox: React.FC<InteractiveSandboxProps> = ({
  onRegisterRageClick,
  sandboxContainerRef,
  onScenarioChange,
  hudOverlay,
}) => {
  const [scenario, setScenario] = useState<SandboxScenario>('checkout_deadend');
  const [clickTimestamps, setClickTimestamps] = useState<number[]>([]);

  // Scenario 1: Checkout state
  const [step, setStep] = useState<'cart' | 'shipping' | 'payment' | 'deadend_success'>('cart');
  const [paymentOption, setPaymentOption] = useState<'apple_pay' | 'card' | ''>('');

  // Scenario 2: Mobile keyboard state
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState('1500');

  // Scenario 3: WCAG & Colorblindness filter
  const [colorFilter, setColorFilter] = useState<'normal' | 'deuteranopia' | 'achromatopsia'>('normal');

  // Scenario 4: i18n language (UA, EN, DE, AR)
  const [lang, setLang] = useState<'ua' | 'en' | 'de' | 'ar'>('ua');

  // Scenario 5: Kiosk timeout
  const [kioskTime, setKioskTime] = useState(25);

  const handleScenarioSelect = (s: SandboxScenario) => {
    setScenario(s);
    setStep('cart');
    setKeyboardOpen(false);
    setKioskTime(25);

    const scenarioLabels: Record<SandboxScenario, string> = {
      checkout_deadend: 'Чекаут e-Com & Тупиковий екран UX',
      wcag_contrast: 'WCAG 2.2 & Контрастність тексту',
      mobile_keyboard_block: 'Мобільна форма & Блокування клавіатурою',
      i18n_overflow: 'i18n Локалізація & RTL верстка',
      pos_kiosk: 'Термінал самообслуговування / Kiosk',
    };
    onScenarioChange?.(scenarioLabels[s]);
  };

  // Rage click detector
  const handleContainerClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const updated = [...clickTimestamps, now].filter((t) => now - t < 1500);
    setClickTimestamps(updated);

    if (updated.length >= 3) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
      onRegisterRageClick(x, y);
      setClickTimestamps([]);
    }
  };

  const resetFlow = () => {
    setStep('cart');
    setKeyboardOpen(false);
    setKioskTime(25);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl isolate">
      {/* Sandbox Scenario Selector Bar */}
      <div className="relative z-20 bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-md shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Інтерактивний симулятор прототипу (Live Sandbox)
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => handleScenarioSelect('checkout_deadend')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              scenario === 'checkout_deadend'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            🛒 Чекаут та Тупик UX
          </button>
          <button
            onClick={() => handleScenarioSelect('wcag_contrast')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              scenario === 'wcag_contrast'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            👁️ WCAG & Контраст
          </button>
          <button
            onClick={() => handleScenarioSelect('mobile_keyboard_block')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              scenario === 'mobile_keyboard_block'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            ⌨️ Перекриття клавіатурою
          </button>
          <button
            onClick={() => handleScenarioSelect('i18n_overflow')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              scenario === 'i18n_overflow'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            🌐 i18n & RTL Верстка
          </button>
          <button
            onClick={() => handleScenarioSelect('pos_kiosk')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              scenario === 'pos_kiosk'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            🏧 Термінал / POS
          </button>
        </div>

        <button
          onClick={resetFlow}
          title="Скинути стан"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interactive Mobile / Web Frame Viewport */}
      <div 
        ref={sandboxContainerRef}
        onClick={handleContainerClick}
        className="relative flex-1 bg-slate-950 p-4 sm:p-6 flex items-center justify-center overflow-auto select-none"
      >
        {/* Unified Phone Device Mockup Container with Pixel-Perfect Attached HUD Layer */}
        <div className="relative w-full max-w-[340px] min-h-[520px] flex flex-col items-stretch transition-all">
          {/* Scenario 1: Checkout & Dead End Screen */}
          {scenario === 'checkout_deadend' && (
            <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[520px] relative transition-all">
            {/* Top Bar with intentional tiny 20px close button */}
            <div className="bg-slate-950/70 px-4 py-3 flex items-center justify-between border-b border-slate-800/80">
              <span className="text-xs font-semibold text-slate-300">Оформлення замовлення</span>
              
              {/* VULNERABILITY: Tiny Touch Target (<44px) - 20x20px button */}
              <button
                onClick={() => alert('Кнопку закриття натиснуто (20x20px)')}
                className="w-5 h-5 flex items-center justify-center text-[10px] text-slate-500 hover:text-slate-300 bg-slate-800/50 rounded"
                title="Закрити (Touch target: 20x20px)"
              >
                ✕
              </button>
            </div>

            {/* Content per Step */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              {step === 'cart' && (
                <div className="space-y-4">
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-950/80 border border-indigo-700/50 rounded-lg flex items-center justify-center text-xl">
                      🎧
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-100">Навушники Spatial Pro Wireless</div>
                      {/* VULNERABILITY: Low contrast gray text */}
                      <div className="text-xs text-slate-600 font-mono">5 890 ₴ · Matte Black</div>
                    </div>
                  </div>

                  <div className="bg-slate-800/20 p-3 rounded-xl border border-slate-800/50 space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Вартість</span>
                      <span>5 890 ₴</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Доставка</span>
                      <span className="text-emerald-400 font-medium">Безкоштовно</span>
                    </div>
                  </div>

                  {/* VULNERABILITY: Low Contrast disclaimer (<2.4:1 ratio) */}
                  <p className="text-[10px] text-slate-700 leading-tight">
                    Натискаючи продовжити, ви погоджуєтеся з умовами користувацької угоди та незворотного резервування послуги.
                  </p>
                </div>
              )}

              {step === 'shipping' && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-200">Адреса доставки</div>
                  <input
                    type="text"
                    defaultValue="вул. Хрещатик, 22, кв. 14, Київ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  />
                  {/* VULNERABILITY: Illogical step order */}
                  <div className="text-xs font-semibold text-slate-200 pt-2">Спосіб оплати</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentOption('apple_pay')}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                        paymentOption === 'apple_pay'
                          ? 'border-indigo-500 bg-indigo-950/50 text-white'
                          : 'border-slate-800 bg-slate-950/50 text-slate-400'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> Apple Pay
                    </button>
                    <button
                      onClick={() => setPaymentOption('card')}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                        paymentOption === 'card'
                          ? 'border-indigo-500 bg-indigo-950/50 text-white'
                          : 'border-slate-800 bg-slate-950/50 text-slate-400'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Visa / MC
                    </button>
                  </div>
                </div>
              )}

              {/* VULNERABILITY: Dead-End Screen! No "Back", no "Home", no "Close" button */}
              {step === 'deadend_success' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-100">Замовлення успішно підтверджено!</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Номер замовлення #UX-98421. Електронний квиток надіслано на пошту.
                    </p>
                  </div>
                  <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl text-[11px] text-rose-300">
                    ⚠️ <b>Тупиковий екран:</b> Немає кнопки «Назад», «На головну» або «В каталог». Користувач заблокований! Клікайте швидко кілька разів — спрацює детекція Rage Clicks.
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {step !== 'deadend_success' && (
                <div className="pt-4 space-y-2">
                  <button
                    onClick={() => {
                      if (step === 'cart') setStep('shipping');
                      else if (step === 'shipping') setStep('deadend_success');
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                  >
                    {step === 'cart' ? 'Перейти до оформлення' : 'Підтвердити 5 890 ₴'}
                  </button>

                  {step === 'shipping' && (
                    <button
                      onClick={() => setStep('cart')}
                      className="w-full text-slate-400 hover:text-slate-200 text-xs py-1.5"
                    >
                      ← Повернутися до кошика
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scenario 2: Mobile Form with Keyboard Occlusion */}
        {scenario === 'mobile_keyboard_block' && (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[520px] relative transition-all">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Грошовий переказ / IBAN</span>
              <button
                onClick={() => setKeyboardOpen(!keyboardOpen)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                  keyboardOpen ? 'bg-amber-950 text-amber-300 border-amber-700' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <KeyboardIcon className="w-3 h-3" />
                {keyboardOpen ? 'Клавіатура УВІМК' : 'Клавіатура ВИМК'}
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Отримувач (IBAN або картка)</label>
                <input
                  type="text"
                  defaultValue="UA213223130000026007233566731"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Сума переказу (₴)</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Призначення платежу</label>
                <textarea
                  onFocus={() => setKeyboardOpen(true)}
                  rows={2}
                  placeholder="Оплата рахунку за послуги..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 resize-none"
                />
              </div>

              {/* Critical CTA Button that gets occluded */}
              <div className="pt-2">
                <button
                  onClick={() => alert('Платіж надіслано')}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl shadow-lg transition-all"
                >
                  Надіслати {transferAmount} ₴
                </button>
              </div>
            </div>

            {/* VULNERABILITY: Simulated Virtual Keyboard that completely covers the CTA button! */}
            {keyboardOpen && (
              <div className="absolute inset-x-0 bottom-0 bg-slate-800 border-t border-slate-700 p-3 shadow-2xl z-20 animate-in slide-in-from-bottom duration-200">
                <div className="flex justify-between items-center mb-2 px-1 text-[10px] text-slate-400">
                  <span>Клавіатура iOS / Android</span>
                  <button 
                    onClick={() => setKeyboardOpen(false)}
                    className="text-indigo-400 hover:underline"
                  >
                    Приховати
                  </button>
                </div>
                <div className="grid grid-cols-10 gap-1 text-center font-mono text-xs">
                  {['Q','W','E','R','T','Y','U','I','O','P'].map((k) => (
                    <div key={k} className="bg-slate-700 py-2 rounded text-slate-200 shadow-sm">{k}</div>
                  ))}
                  {['A','S','D','F','G','H','J','K','L'].map((k) => (
                    <div key={k} className="bg-slate-700 py-2 rounded text-slate-200 shadow-sm col-span-1">{k}</div>
                  ))}
                  <div className="col-span-10 bg-slate-600/80 py-2 rounded text-xs text-slate-300 mt-1">Пробіл</div>
                </div>
                <div className="mt-2 text-[10px] text-amber-300 bg-amber-950/60 p-1.5 rounded border border-amber-800/50 text-center">
                  ⚠️ Кнопка «Надіслати» повністю перекрита клавіатурою! Відсутній автоскрол.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scenario 3: WCAG & Colorblindness */}
        {scenario === 'wcag_contrast' && (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 min-h-[520px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-200">Моніторинг сервісів</span>
              <div className="flex gap-1 text-[10px]">
                <button
                  onClick={() => setColorFilter('normal')}
                  className={`px-1.5 py-0.5 rounded ${colorFilter === 'normal' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  Звичайний
                </button>
                <button
                  onClick={() => setColorFilter('deuteranopia')}
                  className={`px-1.5 py-0.5 rounded ${colorFilter === 'deuteranopia' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  title="Симуляція дейтеранопії (зелений/червоний)"
                >
                  Дальтонізм
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* VULNERABILITY: Color-only indicator without text/icon description */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Головний кластер БД</div>
                  {/* VULNERABILITY: ultra low contrast gray 1.8:1 */}
                  <div className="text-[10px] text-slate-600">Навантаження 94% · 12 вузлів</div>
                </div>
                {/* Status dot ONLY - inaccessible for colorblind users */}
                <div className={`w-3.5 h-3.5 rounded-full ${
                  colorFilter === 'deuteranopia' ? 'bg-amber-600' : 'bg-red-500'
                }`} title="Лише кольорова крапка без іконки чи підпису!" />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Кеш Redis</div>
                  <div className="text-[10px] text-slate-600">Навантаження 18% · У нормі</div>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full ${
                  colorFilter === 'deuteranopia' ? 'bg-amber-600' : 'bg-emerald-500'
                }`} />
              </div>

              {/* VULNERABILITY: tiny text and touch zone */}
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-[9px] text-slate-500 leading-tight block">
                  WCAG 1.4.1 Порушення: критична інформація передається виключно кольором індикатора. Користувач із дальтонізмом не відрізнить збій від нормального стану.
                </span>
                <button className="mt-2 text-[10px] text-indigo-400 hover:underline">
                  Перезапустити вузол (Кнопка без role="button")
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scenario 4: i18n & Localization Overflow */}
        {scenario === 'i18n_overflow' && (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 min-h-[520px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-200">Конфігуратор послуги</span>
              <div className="flex gap-1 text-[10px]">
                <button
                  onClick={() => setLang('ua')}
                  className={`px-1.5 py-0.5 rounded ${lang === 'ua' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  UA
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`px-1.5 py-0.5 rounded ${lang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang('de')}
                  className={`px-1.5 py-0.5 rounded ${lang === 'de' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  DE
                </button>
                <button
                  onClick={() => setLang('ar')}
                  className={`px-1.5 py-0.5 rounded ${lang === 'ar' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                >
                  AR (RTL)
                </button>
              </div>
            </div>

            <div className={`space-y-3 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
              <div className="text-xs font-medium text-slate-300">
                {lang === 'ua' && 'Конфігуратор умов страхування подорожей'}
                {lang === 'en' && 'Travel Insurance Policy Configurator'}
                {lang === 'de' && 'Reiserücktrittsversicherungskonfigurator'}
                {lang === 'ar' && 'محدد شروط تأمين السفر والإلغاء'}
              </div>

              {/* VULNERABILITY: Fixed width container causing text clipping/overflow in German */}
              <div className="w-[200px] h-10 bg-indigo-600 text-white rounded-lg flex items-center px-3 text-xs font-bold overflow-hidden shadow">
                <span className="truncate">
                  {lang === 'ua' && 'Підтвердити вибір'}
                  {lang === 'en' && 'Confirm Selection'}
                  {lang === 'de' && 'Zahlungsabwicklungsbestätigung'}
                  {lang === 'ar' && 'تأكيد عملية الدفع والتسجيل'}
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                {lang === 'ua' && 'Кнопка "Zahlungsabwicklungsbestätigung" у німецькій локалізації обрізається контейнером фіксованої ширини.'}
                {lang === 'en' && 'In German, compound words like "Zahlungsabwicklungsbestätigung" overflow fixed-width buttons.'}
                {lang === 'de' && '⚠️ Fehler: Der Text passt nicht in die Schaltfläche und wird abgeschnitten! (i18n Overflow)'}
                {lang === 'ar' && '⚠️ خطأ: اتجاه النص لا يتوافق مع عناصر واجهة المستخدم RTL.'}
              </div>
            </div>
          </div>
        )}

        {/* Scenario 5: POS / Kiosk Terminal */}
        {scenario === 'pos_kiosk' && (
          <div className="w-full bg-slate-900 border-4 border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 min-h-[520px] flex flex-col justify-between">
            <div className="bg-slate-950 p-2 rounded-lg flex justify-between items-center text-xs font-mono text-amber-400 border border-slate-800">
              <span>ТЕРМІНАЛ САМООБСЛУГОВУВАННЯ #04</span>
              <span>Таймаут: {kioskTime}с</span>
            </div>

            <div className="space-y-3">
              <div className="text-center py-2">
                <div className="text-xs text-slate-400">Прикладіть картку або смартфон</div>
                <div className="text-2xl font-black text-slate-100 mt-1">450.00 ₴</div>
              </div>

              {/* VULNERABILITY: Small fonts on kiosk from standing distance + D-Pad focus trap */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 font-semibold border border-slate-700">
                  Друк чека
                </button>
                <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 font-semibold border border-slate-700">
                  Електронний чек
                </button>
              </div>

              {/* VULNERABILITY: Tiny cancel button in corner of big terminal */}
              <div className="pt-2 text-center">
                <button 
                  onClick={() => alert('Скасування операції')}
                  className="text-[10px] text-slate-600 hover:text-slate-400 underline"
                >
                  Скасувати операцію
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pixel-Perfect In-Phone HUD Layer - 100% Locked to Device Screen */}
        {hudOverlay && (
          <div className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden z-10">
            {hudOverlay}
          </div>
        )}
      </div>
    </div>

      {/* Sandbox Footer Hint */}
      <div className="relative z-20 bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          Клікайте по екрану — ШІ-аудитор сканує цей інтерфейс у режимі реального часу!
        </span>
        <span className="text-[11px] text-slate-500 font-mono">
          3x швидких кліки = Rage Click
        </span>
      </div>
    </div>
  );
};
