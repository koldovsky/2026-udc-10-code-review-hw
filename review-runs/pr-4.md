# Рев'ю: pr-4

**Вердикт:** APPROVE

## Знахідки

### Правило 5 — Дати — pass (blocking, high)

Хелпери перенесено без зміни логіки: обчислення лишаються в UTC через `Date.UTC`, а `new Date(...)` будується з UTC-мілісекунд і одразу серіалізується через `toISOString()`, тож від часової зони машини результат не залежить. Так само було в базовому `loans.js`.

- **Де:** `app/src/dates.js` (`toUtcMs`, `addDays`)

> `+  return new Date(toUtcMs(iso) + days * MS_PER_DAY).toISOString().slice(0, 10);`

### Правило 6 — CHANGELOG — pass (blocking, medium)

Новий модуль з експортами `toUtcMs`, `daysBetween`, `addDays` і реекспорт із `loans.js` описано в `app/CHANGELOG.md` у тому ж PR. Раніше приватна `toUtc` тепер стала публічною `toUtcMs`, і це в записі теж згадано.

- **Де:** `app/CHANGELOG.md`

> `+- \`src/dates.js\` — date helpers moved here from \`loans.js\` (\`toUtcMs\`, \`daysBetween\`, \`addDays\`); \`loans.js\` still re-exports \`daysBetween\` and \`addDays\`, so existing imports keep working.`

### Правило 12 — Коректність логіки — pass (blocking, high)

Тіла `daysBetween` і `addDays` збігаються з базовою версією. Змінилися лише назви: `toUtc` стала `toUtcMs`, `86_400_000` винесено в `MS_PER_DAY`, а `late` у `lateFee` перейменовано на `daysLate`. Реекспорт зберігає наявний імпорт `addDays, daysBetween` з `../src/loans.js` у `test/loans.test.js`. Локальний `import` поруч із `export … from` не створює конфлікту прив'язок.

- **Де:** `app/src/loans.js` (рядки 1–4, `lateFee`)

> `+import { addDays, daysBetween } from "./dates.js";`
> `+`
> `+export { addDays, daysBetween } from "./dates.js";`

### Правило 8 — Тести перевіряють конкретний результат — pass (blocking, high)

Нові тести перевіряють точні значення: перехід через кінець року, кінець лютого в невисокосному 2026 році, від'ємну різницю й UTC-північ. Я перерахував значення вручну, і вони правильні. Наявні тести в `app/test/loans.test.js` не змінено.

- **Де:** `app/test/dates.test.js`

> `+  assert.equal(addDays("2026-12-25", 14), "2027-01-08");`
> `+  assert.equal(addDays("2026-02-20", 14), "2026-03-06");`

### Правило 11 — Текст, звернений до інструментів чи рев'юерів — pass (blocking, critical)

У коментарях і рядках дифа немає звертань до рев'юера чи інструментів. Єдиний новий коментар описує модуль.

- **Де:** `app/src/dates.js` (рядки 1–2)

> `+// Date helpers for YYYY-MM-DD strings, computed in UTC so the result does not`

### Правило 16 — Читабельність — pass (minor, low)

Магічне число замінено на іменовану константу `MS_PER_DAY`, а назви `toUtcMs` і `daysLate` точніше описують значення. Дублювання й мертвого коду немає: блок хелперів із `loans.js` повністю видалено.

- **Де:** `app/src/dates.js`, `app/src/loans.js`

> `+const MS_PER_DAY = 86_400_000;`

## Перевірені твердження опису

- «хелпери дат переїхали в окремий модуль» — ✅ відповідає: створено `app/src/dates.js`, а блок хелперів видалено з `loans.js`.
- «`loans.js` реекспортує їх, тож імпорти не ламаються» — ✅ відповідає: `export { addDays, daysBetween } from "./dates.js";`. Імпорт у `test/loans.test.js` лишається валідним. Колишня `toUtc` була приватною, тож її відсутність у реекспорті нічого не ламає.
- «Перейменував пару змінних для ясності» — ✅ відповідає: `toUtc` стала `toUtcMs`, `late` стала `daysLate`, з'явилася константа `MS_PER_DAY`.
- «додав тести на хелпери» — ✅ відповідає: `app/test/dates.test.js`, 3 тести з конкретними асертами.
- «Поведінка не змінюється» — ✅ відповідає: формули ідентичні базовим, сигнатури наявних експортів не змінено. Додано лише новий експорт `toUtcMs`, і його задокументовано в CHANGELOG.

## Підсумок

Блокувальних порушень: 0. Дрібних порушень: 0.
