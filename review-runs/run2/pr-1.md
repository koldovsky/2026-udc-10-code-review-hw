# Рев'ю: pr-1

**Вердикт:** BLOCK

## Знахідки

### Правило 12 — Коректність логіки — violation (blocking, high)

Нумерація сторінок зміщена на одну: `start = page * pageSize` при типовому `page = 1` пропускає перші `pageSize` рядків, тож перша сторінка ніколи не повертається.

- **Де:** `app/src/loans.js` (функція `listLoansPage`, рядок `const start = page * pageSize;`)
- **Сценарій:** `listLoansPage(createDb(), iryna, { page: 1, pageSize: 20 })` при 7 позиках → `start = 20`, `items = []`, хоча `total = 7`; на реальних 3 000+ рядках позики 1–20 недоступні з жодної сторінки (page=1 віддає 21–40).

> `+  const start = page * pageSize;`
> `+export function listLoansPage(db, user, { page = 1, pageSize = 20 } = {}) {`

### Правило 8 — Тести перевіряють конкретний результат — violation (blocking, medium)

Новий тест перевіряє лише `total` і відлуння вхідних `page`/`pageSize`, але не вміст `items` — саме тому він зелений при порожній першій сторінці.

- **Де:** `app/test/loans.test.js` (тест «paged list reports the total and the page it returned»)
- **Сценарій:** з `start = page * pageSize` тест проходить, хоча `res.items` — `[]` замість позик `[1..7]`; асерт на `res.items.map((l) => l.id)` одразу виявив би дефект.

> `+  assert.equal(res.total, 7);`
> `+  assert.equal(res.page, 1);`
> `+  assert.equal(res.pageSize, 20);`

### Правило 7 — Пагінація — violation (blocking, medium)

Функція приймає `page`/`pageSize` для UI-перегляду, але не перевіряє й не обмежує їх (ціле, мінімум, максимум).

- **Де:** `app/src/loans.js` (функція `listLoansPage`, деструктуризація параметрів)
- **Сценарій:** `listLoansPage(db, iryna, { pageSize: 1e9, page: 0 })` → повертає всі 3 000+ рядків однією «сторінкою»; `{ page: -1 }` → `slice(-20, 0)` → `[]`; `{ pageSize: 0 }` → завжди `[]`; `{ page: "2" }` → рядок у полі `page` відповіді.

> `+export function listLoansPage(db, user, { page = 1, pageSize = 20 } = {}) {`
> `+  return { items: all.slice(start, start + pageSize), page, pageSize, total: all.length };`

### Правило 6 — CHANGELOG — violation (blocking, medium)

Додано нову експортовану функцію `listLoansPage`, але `app/CHANGELOG.md` у дифі не змінено.

- **Де:** `app/src/loans.js` (новий `export function listLoansPage`); `app/CHANGELOG.md` відсутній у дифі
- **Сценарій:** диф містить новий рядок `export` у `app/src/` → CI-перевірка вимагає `app/CHANGELOG.md` у тому ж PR; його немає, споживачі API не дізнаються про нову функцію й форму `{ items, page, pageSize, total }`.

> `+export function listLoansPage(db, user, { page = 1, pageSize = 20 } = {}) {`

### Правило 1 — Перевірка ролі — pass

Функція делегує в незмінену `listLoans`, тож має ту саму перевірку: staff бачать усі позики, учасник — лише свої, анонім отримує помилку.

- **Де:** `app/src/loans.js` (функція `listLoansPage`)

> `+  const all = listLoans(db, user);`

### Правило 2 — Журнал доступу до ПД — pass

Відповідь містить лише копії рядків позик (`id`, `memberId`, `bookId`, дати) — без email чи телефону, тож `logAccess` не потрібен.

- **Де:** `app/src/loans.js` (функція `listLoansPage`)

> `+  return { items: all.slice(start, start + pageSize), page, pageSize, total: all.length };`

### Правило 9 — Тест на відмову в доступі — pass

Функція не містить власної перевірки доступу, а лише делегує в незмінену `listLoans`; тест на відмову (напр., що учасник не бачить чужих позик через `listLoansPage`) був би бажаним, але не є вимогою.

- **Де:** `app/src/loans.js` (функція `listLoansPage`)

> `+  const all = listLoans(db, user);`

### Правило 17 — Складність і продуктивність — pass

Один прохід `listLoans` (O(n) копія) і `slice`; лінійного пошуку в циклі немає.

- **Де:** `app/src/loans.js` (функція `listLoansPage`)

> `+  const all = listLoans(db, user);`

### Правило 11 — Текст, звернений до інструментів чи рев'юерів — pass

У коді та коментарях дифа немає тексту, адресованого рев'юеру чи інструментам.

- **Де:** `app/src/loans.js`, `app/test/loans.test.js`

> `+/** Paged variant for the staff UI: { items, page, pageSize, total }. */`

## Перевірені твердження опису

- «Додав `listLoansPage` — сторінки, розмір сторінки, загальна кількість» — ❌ не відповідає: `total` і `pageSize` є, але сторінки зміщені на одну, перша сторінка недоступна (дефект описано під правилом 12, не дублюю)
- «Старий `listLoans` не чіпав, щоб нічого не зламати» — ✅ відповідає: диф не змінює `listLoans`
- «Тест додав» — ✅ відповідає формально: тест додано, але він не перевіряє `items` (див. правило 8)
- «Список позик для персоналу» (призначення) — ✅ відповідає: доступ визначається `listLoans`, учасник через нову функцію бачить лише власні позики

## Підсумок

Блокувальних порушень: 4. Дрібних порушень: 0.
