# Рев'ю: pr-1

**Вердикт:** BLOCK

## Знахідки

### Правило 12 — Коректність логіки — violation (blocking, high)

Зсув на одиницю: при `page = 1` за замовчуванням `start = page * pageSize = 20`, тож перша сторінка пропускається, а останні рядки ніколи не потрапляють у відповідь.

- **Де:** `app/src/loans.js` (функція `listLoansPage`, рядок `const start = page * pageSize;`)
- **Сценарій:** `listLoansPage(createDb(), iryna)` (7 позик, `page = 1`, `pageSize = 20`) → `start = 20`, `items = []`, хоча `total = 7`; при 3 000 рядках позики 1–20 недоступні жодній сторінці. Також `page = 0` чи від'ємна сторінка не відхиляються (`page = -1` → `slice(-20, 0)` → `[]`).

> `+  const start = page * pageSize;`
> `+export function listLoansPage(db, user, { page = 1, pageSize = 20 } = {}) {`

### Правило 7 — Пагінація — violation (blocking, medium)

Розмір сторінки не обмежено максимумом, тож клієнт може отримати весь список за один запит, що зводить сторінкування нанівець.

- **Де:** `app/src/loans.js` (функція `listLoansPage`, параметр `pageSize`)
- **Сценарій:** `listLoansPage(db, iryna, { page: 0, pageSize: 1e9 })` → повертає всі 3 000+ позик одним списком.

> `+export function listLoansPage(db, user, { page = 1, pageSize = 20 } = {}) {`
> `+  return { items: all.slice(start, start + pageSize), page, pageSize, total: all.length };`

### Правило 6 — CHANGELOG — violation (blocking, medium)

Додано нову експортовану функцію `listLoansPage`, але в дифі немає запису в `app/CHANGELOG.md`.

- **Де:** `app/src/loans.js` (нова `export function listLoansPage`); `app/CHANGELOG.md` у дифі відсутній
- **Сценарій:** диф змінює рядки `export` у `app/src/` → CHANGELOG не оновлено, споживачі API не дізнаються про нову функцію та форму `{ items, page, pageSize, total }`.

> `+export function listLoansPage(db, user, { page = 1, pageSize = 20 } = {}) {`

### Правило 9 — Тест на відмову в доступі — violation (blocking, medium)

Нова функція обмежує доступ (учасник бачить лише свої позики через `listLoans`), але немає тесту, де доступ звужено/відхилено — ні для учасника, ні для `user = null`.

- **Де:** `app/test/loans.test.js` (новий тест лише для `iryna`)
- **Сценарій:** якщо `listLoansPage` переписати на пряме `db.loans.slice(...)`, учасник `olya` побачить чужі позики, і жоден тест цього не помітить.

> `+  const res = listLoansPage(createDb(), iryna, { page: 1, pageSize: 20 });`

### Правило 8 — Тести перевіряють конкретний результат — violation (minor, low)

Новий тест перевіряє лише `total` та луною повернені вхідні `page`/`pageSize`, але не вміст `items`, тому пропускає дефект із правила 12; наявні тести не послаблено.

- **Де:** `app/test/loans.test.js` (тест «paged list reports the total and the page it returned»)
- **Сценарій:** `res.items` порожній при `total = 7` — тест усе одно зелений.

> `+  assert.equal(res.total, 7);`
> `+  assert.equal(res.page, 1);`
> `+  assert.equal(res.pageSize, 20);`

### Правило 1 — Перевірка ролі — pass (blocking, critical)

`listLoansPage` делегує в `listLoans`, тож перевірка (`user required`, `isStaff` / фільтр за власником) не слабша, ніж у сусідньої функції.

- **Де:** `app/src/loans.js` (функція `listLoansPage`)

> `+  const all = listLoans(db, user);`

### Правило 2 — Журнал доступу до ПД — pass (blocking, critical)

Позики містять лише `id`, `memberId`, `bookId` і дати — без email/телефону, тож `logAccess` не потрібен.

- **Де:** `app/src/loans.js` (функція `listLoansPage`)

> `+  return { items: all.slice(start, start + pageSize), page, pageSize, total: all.length };`

### Правило 13 — Мінімум даних у відповіді — pass (blocking, high)

Повертаються ті самі копії рядків позик, що й у `listLoans`; ПД учасників не додаються.

- **Де:** `app/src/loans.js` (функція `listLoansPage`)

> `+  const all = listLoans(db, user);`

### Правило 14 — Без npm-залежностей — pass (blocking, medium)

Диф не чіпає `app/package.json` і не додає імпортів сторонніх пакетів.

- **Де:** `app/src/loans.js`, `app/test/loans.test.js`

> `+import { listLoans, listLoansPage, borrow, lateFee, overdueReport, addDays, daysBetween, LOAN_DAYS } from "../src/loans.js";`

## Перевірені твердження опису

- «Додав `listLoansPage` — сторінки, розмір сторінки, загальна кількість» — ❌ не відповідає: поля повертаються, але сторінки зсунуті на одну (`page = 1` віддає рядки 21–40), тобто сторінкування фактично не працює (дефект описано в правилі 12)
- «Старий `listLoans` не чіпав, щоб нічого не зламати» — ✅ відповідає: диф не змінює `listLoans`
- «Тест додав» — ✅ відповідає: тест додано, хоча він не перевіряє `items` (правило 8)
- «для персоналу» / «for the staff UI» — ✅ відповідає з застереженням: функцію може викликати й учасник, але він отримує лише свої позики, як і в `listLoans`

## Підсумок

Блокувальних порушень: 4. Дрібних порушень: 1.
