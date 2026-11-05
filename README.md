# Live Accessibility & UX Auditor (Enterprise Edition)

<div align="center">

![WCAG 2.2 AA](https://img.shields.io/badge/WCAG-2.2%20AA-emerald?style=for-the-badge)
![Google Gemini 3.8 Flash](https://img.shields.io/badge/Gemini%20API-3.8%20Flash-indigo?style=for-the-badge&logo=google)
![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-Test%20Export-45BA4B?style=for-the-badge&logo=playwright&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%20v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![License MIT](https://img.shields.io/badge/License-MIT-slate?style=for-the-badge)

<p align="center">
  <strong>Мультимодальна платформа реверс-інжинірингу інтерфейсів, автоматизованого аудиту доступності (WCAG 2.2 AA) та виправлення UX-дефектів у реальному часі на базі Google Gemini API.</strong>
</p>

### 🚀 Розгортання в один клік (1-Click Deployment)

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/new)
&nbsp;&nbsp;
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

</div>

---

## 🏷️ Теги репозиторію (GitHub Topics)
`accessibility` · `wcag` · `gemini-api` · `ai-auditor` · `ux-audit` · `playwright` · `react19` · `computer-use` · `reverse-engineering` · `zero-downtime`

---

## 🚀 Основні можливості

1. **Мультимодальний контур (Edge Tier Stream Viewer):**
   - Захват відеопотоку екрана (`Screen Share`) або використання інтерактивного симулятора прототипу (*Live Sandbox*) із 5 реалістичними сценаріями збоїв.
   - Динамічне малювання HUD-рамок і бейджів дефектів (*Pixel-Perfect* прив'язка до екрана при будь-якому масштабі).
   - Голосові нотатки тестувальника у реальному часі через **Web Speech API** з живим виведенням субтитрів.

2. **Інтерактивна пісочниця (Live Sandbox) із 5 сценаріями:**
   - 🛒 **Чекаут та Тупик UX** (критичні відсутності кнопок повернення).
   - 👁️ **WCAG & Контрастність** (перевірка кольорів та симуляція дальтонізму/дейтеранопії).
   - ⌨️ **Перекриття клавіатурою** (блокування CTA-кнопок віртуальною клавіатурою без автоскролу).
   - 🌐 **i18n & RTL Верстка** (обрізання довгих німецьких слів та перевірка арабської локалізації).
   - 🏧 **Термінал / POS** (тестування розмірів тайтлів та таймаутів самообслуговування).

3. **Автономна система безпеки та квот (Auto-Cascade & Quota Guard):**
   - Автоматичне перемикання моделей при вичерпанні лімітів (`gemini-3.8-flash` ➡️ `gemini-3.5-flash-lite` ➡️ `gemini-4-argon`).
   - Панель вибору та перевірки статусів модельних квот у реальному часі.

4. **Глибокий рефакторинг коду (Deep Refactor & Fixes):**
   - Генерація патчів коду (*Було / Стало*) із виправленнями на React 19 та Tailwind CSS.
   - Експорт готових тестів для CI/CD у форматі **Playwright `.spec.ts`** та розмічених стікерів для **Figma / FigJam**.

5. **Enterprise-grade Production Ready:**
   - Захисний екран від збоїв (**React Error Boundary**).
   - Повне збереження результатів сесії та статистики у **LocalStorage** із можливістю швидкого скидання.
   - Фірмовий експорт та друк підсумкового звіту у **PDF** (`@media print`).
   - Глобальні гарячі клавіші (`Escape` для закриття модальних вікон, `Ctrl + Shift + D` для відкриття Debug-панелі).

---

## 🛠️ Архітектура проєкту

```text
src/
├── components/
│   ├── EdgeTierStreamViewer.tsx # Стрім, HUD оверлей та голосові нотатки
│   ├── InteractiveSandbox.tsx   # Симулятор прототипу з 5 сценаріями
│   ├── PhotoUploadAuditor.tsx   # Завантаження фото та реверс-інжиніринг
│   ├── BrokerQueueInspector.tsx # Асинхронний контур (Async Broker Pipeline)
│   ├── CjmGraphView.tsx         # Customer Journey Map та шлях користувача
│   ├── DeepRefactorDrawer.tsx   # Шторка виправлення коду та експорт Playwright
│   ├── ExecutiveReportModal.tsx # Підсумковий звіт, експорт MD, JSON та PDF
│   ├── DebugPanel.tsx           # Вибір моделі ШІ та моніторинг квот
│   └── ErrorBoundary.tsx        # Захисний аварійний екран від збоїв
├── utils/
│   ├── voiceDictation.ts        # Голосові нотатки (Web Speech API)
│   └── audioAlert.ts            # Аудіо-сповіщення (Rage Click / Critical)
├── types/
│   └── auditor.ts               # TypeScript типи та інтерфейси аномалій
├── App.tsx                      # Головний компонент із Persistence та Shortcut хуками
└── main.tsx                     # Корінь рендерингу з ErrorBoundary
server.ts                        # Серверний проксі для безпечного виклику Gemini API
```

---

## ⚙️ Інструкція зі встановлення та запуску

### Варіант А: Локальний запуск через Node.js
1. **Клонуйте репозиторій:**
   ```bash
   git clone https://github.com/Dimacey/live-accessibility-ux-auditor.git
   cd live-accessibility-ux-auditor
   ```

2. **Встановіть залежності:**
   ```bash
   npm install
   ```

3. **Налаштуйте змінні середовища:**
   Створіть файл `.env` на основі `.env.example`:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
   *(УВАГА: Ваш ключ захищений на сервері та ніколи не потрапить у відкритий доступ завдяки .gitignore).*

4. **Запустіть режим розробника (Dev Server):**
   ```bash
   npm run dev
   ```
   Застосунок запуститься на `http://localhost:3000`.

5. **Збірка для продакшену:**
   ```bash
   npm run build
   ```

---

### Варіант Б: Запуск в 1 клік через Docker
```bash
# 1. Збірка контейнера
docker build -t live-ux-auditor .

# 2. Запуск сервісу
docker run -d -p 3000:3000 -e GEMINI_API_KEY="ваш_ключ" --name auditor live-ux-auditor
```
Після цього відкрийте `http://localhost:3000` у браузері.

---

## 🛡️ Безпека та ліцензія
- **Безпека ключа:** Бекенд повністю захищає API-ключ Gemini на сервері (`server.ts`). Підтримується режим **BYOK** (Bring Your Own Key).
- **Ліцензія:** [MIT License](LICENSE). Відкритий код для вільного використання розробниками, тестувальниками та бізнесом по всьому світу.
- **Автор:** [Dmytro Terekhov (Dimacey)](https://github.com/Dimacey).
