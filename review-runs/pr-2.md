# Рев'ю: pr-2

**Вердикт:** BLOCK

## Знахідки

### Правило 2 — Журнал доступу до ПД — violation (blocking, critical)

`overdueReport` тепер повертає email учасника в кожному рядку, але не викликає `logAccess` ні для жодного учасника (у дифі немає навіть імпорту `./audit.js`), на відміну від сусідньої `memberCard`.

- **Де:** `app/src/loans.js` (`overdueReport`, `.map(...)`, нове поле `email`)
- **Сценарій:** бібліотекар `iryna` викликає `overdueReport(db, iryna, "2026-10-08")` → отримує email-и Олі (id 1), Тараса (id 2) і Марка (id 5), а `db.accessLog` лишається порожнім; має бути один запис на кожного з цих учасників.

> `+      email: db.findMember(l.memberId)?.email ?? null,`

### Правило 4 — Гроші — цілі копійки — violation (blocking, high)

У `src/` додано форматування суми у гривнях: ділення на 100, `toFixed` і суфікс «грн» у полі без суфікса `…Kopecks`.

- **Де:** `app/src/loans.js` (`overdueReport`, нове поле `feeText`)
- **Сценарій:** для позики 6 на `2026-10-08` API віддає `feeText: "110,00 грн"` — дробове/форматоване значення грошей в API замість лише `feeKopecks: 11000`; форматування має жити на клієнті.

> `+      feeText: (lateFee(l, todayIso) / 100).toFixed(2).replace(".", ",") + " грн",`

### Правило 6 — CHANGELOG — violation (blocking, medium)

Форма відповіді публічної `overdueReport` змінилась (нові поля `email` і `feeText`), але диф не містить запису в `app/CHANGELOG.md` — там досі лише `loanId`, `member`, `book`, `daysLate`, `feeKopecks`.

- **Де:** `app/src/loans.js` (`overdueReport`); `app/CHANGELOG.md` у дифі відсутній
- **Сценарій:** споживач звіту, що орієнтується на CHANGELOG, не дізнається, що в рядках тепер є ПД (`email`) і нове поле `feeText`.

> `+      email: db.findMember(l.memberId)?.email ?? null,`

### Правило 16 — Читабельність — violation (minor, low)

`db.findMember(l.memberId)` викликається двічі на рядок, а `lateFee(l, todayIso)` — двічі; прибрано попередню мапу `names` без потреби; JSDoc функції («with the member's name») більше не описує, що повертається email.

- **Де:** `app/src/loans.js` (`overdueReport`)

> `+      member: db.findMember(l.memberId)?.name ?? "—",`
> `+      email: db.findMember(l.memberId)?.email ?? null,`

### Правило 1 — Перевірка ролі — pass

Перевірку `requireRole(user, STAFF)` не змінено, вона така ж сувора, як у `listMembers`.

- **Де:** `app/src/loans.js` (`overdueReport`, перший рядок тіла)

> ` export function overdueReport(db, user, todayIso) {`
> `   requireRole(user, STAFF);`

### Правило 13 — Мінімум даних у відповіді — pass

Для заявленої мети (писати нагадування) додано лише `name` та `email`, без телефону й без усього об'єкта учасника.

- **Де:** `app/src/loans.js` (`overdueReport`)

> `+      email: db.findMember(l.memberId)?.email ?? null,`

### Правило 12 — Коректність логіки — pass

Фільтр і сортування не змінено; відсутній учасник дає `member: "—"` і `email: null` без винятку.

- **Де:** `app/src/loans.js` (`overdueReport`)

> `+      member: db.findMember(l.memberId)?.name ?? "—",`

### Правило 8 — Тести перевіряють конкретний результат — pass

Наявний тест не послаблено, додано конкретний асерт на значення email (втім, тесту на записи в журналі доступу немає — див. правило 2).

- **Де:** `app/test/loans.test.js` (тест «overdue report lists loans still out past due…»)

> `+  assert.equal(rows[0].email, "marko@example.invalid");`

### Правило 11 — Текст, звернений до інструментів чи рев'юерів — pass

У дифі немає коментарів чи рядків, звернених до рев'юера або інструментів.

- **Де:** `app/src/loans.js`, `app/test/loans.test.js`

> `+      feeText: (lateFee(l, todayIso) / 100).toFixed(2).replace(".", ",") + " грн",`

## Перевірені твердження опису

- «Тепер для кожного рядка беремо учасника і віддаємо ім'я та email» — ✅ відповідає (але опис замовчує додане поле `feeText`, див. правила 4 і 6)
- «Звіт і так лише для персоналу» — ✅ відповідає (`requireRole(user, STAFF)` збережено, є тест на `AccessDenied`)
- «email тут доречний» (неявно — без додаткових вимог) — ❌ не відповідає стандарту: віддача email вимагає `logAccess` на кожного учасника, якого в коді немає (правило 2)

## Підсумок

Блокувальних порушень: 3. Дрібних порушень: 1.
