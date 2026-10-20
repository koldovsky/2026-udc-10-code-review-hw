# Рев'ю: pr-4

**Вердикт:** APPROVE

## Знахідки

### Правило 5 — Дати — pass

Хелпери перенесено без змін логіки: обчислення лишаються в UTC через `Date.UTC`, `new Date(ms).toISOString()` дає UTC-рядок, жодних `getDate`/`setDate` чи локального часу.

- **Де:** `app/src/dates.js` (`toUtcMs`, `daysBetween`, `addDays`)

> `+  return Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));`
> `+  return new Date(toUtcMs(iso) + days * MS_PER_DAY).toISOString().slice(0, 10);`

### Правило 6 — CHANGELOG — pass

Новий публічний модуль і новий експорт `toUtcMs` описано в `app/CHANGELOG.md` у тому ж PR, разом із тим, що `loans.js` реекспортує `daysBetween` і `addDays`.

- **Де:** `app/CHANGELOG.md` (розділ `2026-10`)

> `+- \`src/dates.js\` — date helpers moved here from \`loans.js\` (\`toUtcMs\`, \`daysBetween\`, \`addDays\`); \`loans.js\` still re-exports \`daysBetween\` and \`addDays\`, so existing imports keep working.`

### Правило 4 — Гроші — цілі копійки — pass

У `lateFee` лише перейменовано змінну; арифметика лишається цілочисельною в копійках (`daysBetween` повертає `Math.round`, множиться на `FEE_PER_DAY_KOPECKS`).

- **Де:** `app/src/loans.js` (`lateFee`)

> `+  return daysLate > 0 ? daysLate * FEE_PER_DAY_KOPECKS : 0;`

### Правило 8 — Тести перевіряють конкретний результат — pass

Нові тести перевіряють точні значення (`assert.equal` з конкретними датами й числами), наявні тести в `app/test/loans.test.js` не змінено (імпорт `addDays`, `daysBetween` з `../src/loans.js` і далі працює через реекспорт).

- **Де:** `app/test/dates.test.js`

> `+  assert.equal(addDays("2026-12-25", 14), "2027-01-08");`
> `+  assert.equal(daysBetween("2026-10-08", "2026-10-01"), -7);`

### Правило 12 — Коректність логіки — pass

Тіла функцій ідентичні старим (`86_400_000` винесено в константу `MS_PER_DAY`, `toUtc` → `toUtcMs`), реекспорт зберігає публічний API `loans.js`, тож `borrow`, `lateFee`, `overdueReport` поводяться так само; тести покривають межі місяця/року й від'ємну різницю.

- **Де:** `app/src/loans.js` (рядки імпорту/реекспорту), `app/src/dates.js`

> `+import { addDays, daysBetween } from "./dates.js";`
> `+export { addDays, daysBetween } from "./dates.js";`

### Правило 11 — Текст, звернений до інструментів чи рев'юерів — pass

У дифі немає коментарів чи рядків, звернених до рев'юера або інструментів; коментар у `dates.js` лише описує призначення модуля.

- **Де:** `app/src/dates.js` (рядки 1–2)

> `+// Date helpers for YYYY-MM-DD strings, computed in UTC so the result does not`

### Правило 14 — Без npm-залежностей — pass

Диф не змінює `app/package.json` і не додає сторонніх імпортів — лише `node:test`, `node:assert/strict` і локальні модулі.

- **Де:** `app/test/dates.test.js`

> `+import assert from "node:assert/strict";`

## Перевірені твердження опису

- «хелпери дат переїхали в окремий модуль» — ✅ відповідає (`app/src/dates.js` створено, з `loans.js` хелпери видалено)
- «`loans.js` реекспортує їх, тож імпорти не ламаються» — ✅ відповідає (`export { addDays, daysBetween } from "./dates.js";`; `toUtc` раніше не експортувався, тож нічого не втрачено)
- «Перейменував пару змінних для ясності» — ✅ відповідає (`toUtc` → `toUtcMs`, `late` → `daysLate`, `86_400_000` → `MS_PER_DAY`)
- «додав тести на хелпери» — ✅ відповідає (`app/test/dates.test.js`, три тести з конкретними значеннями)
- «Поведінка не змінюється» — ✅ відповідає (тіла функцій тотожні попереднім; змінено лише назви)

## Підсумок

Блокувальних порушень: 0. Дрібних порушень: 0.
