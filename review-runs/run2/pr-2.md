# Рев'ю: pr-2

**Вердикт:** BLOCK

## Знахідки

### Правило 2 — Журнал доступу до ПД — violation (blocking, critical)

`overdueReport` тепер повертає email кожного боржника, але в дифі немає жодного виклику `logAccess` — ні на учасника, ні на виклик, тоді як сусідня `memberCard` логує кожне читання.

- **Де:** `app/src/loans.js` (`overdueReport`, рядок `email: ...` у `.map`)
- **Сценарій:** бібліотекарка `iryna` викликає `overdueReport(db, iryna, "2026-10-08")` → отримує email учасників 1, 2 і 5 (`olya@`, `taras@`, `marko@example.invalid`), а `db.accessLog` лишається порожнім; потрібно 3 записи (по одному на кожного учасника, чий email віддано).

> `+      email: db.findMember(l.memberId)?.email ?? null,`

### Правило 4 — Гроші — цілі копійки — violation (blocking, high)

Додано поле з дробовими гривнями й форматуванням у `src/`: ділення на 100, `toFixed` і суфікс «грн», без суфікса `…Kopecks`.

- **Де:** `app/src/loans.js` (`overdueReport`, поле `feeText`)
- **Сценарій:** позика 6 на `2026-10-08` → API віддає `feeText: "110,00 грн"` — рядок із форматованою сумою в гривнях замість цілих копійок; форматування має бути на клієнті.

> `+      feeText: (lateFee(l, todayIso) / 100).toFixed(2).replace(".", ",") + " грн",`

### Правило 17 — Складність і продуктивність — violation (blocking, medium)

Диф прибирає наявний індекс `Map` імен і замінює його лінійним `db.findMember` (це `members.find`) у циклі по позиках — ще й двічі на рядок; так само `lateFee` рахується двічі для того самого рядка.

- **Де:** `app/src/loans.js` (`overdueReport`)
- **Сценарій:** при N прострочених позиках і M учасниках вартість зростає з O(N + M) до O(N·M) (2·N лінійних пошуків по `members`); на 10 000 позик × 10 000 учасників — до ~2·10⁸ порівнянь замість ~2·10⁴.

> `-  const names = new Map(db.members.map((m) => [m.id, m.name]));`
> `+      member: db.findMember(l.memberId)?.name ?? "—",`
> `+      email: db.findMember(l.memberId)?.email ?? null,`

### Правило 6 — CHANGELOG — violation (blocking, medium)

Форма відповіді експортованої `overdueReport` змінилась (нові поля `email` і `feeText`), але `app/CHANGELOG.md` у дифі відсутній, а наявний запис досі перелічує лише `loanId`, `member`, `book`, `daysLate`, `feeKopecks`.

- **Де:** `app/CHANGELOG.md` (не змінено); `app/src/loans.js` (`overdueReport`)
- **Сценарій:** споживач API читає CHANGELOG і не дізнається, що звіт тепер містить ПД (`email`) і рядок `feeText`.

> `+      email: db.findMember(l.memberId)?.email ?? null,`
> `+      feeText: (lateFee(l, todayIso) / 100).toFixed(2).replace(".", ",") + " грн",`

### Правило 10 — Опис PR відповідає коду — violation (minor, low)

Опис говорить лише про додавання email («віддаємо ім'я та email»), але диф мовчки додає ще й поле `feeText`; саме поле вже зафіксовано за правилом 4, тут — лише неповнота опису.

- **Де:** `review-queue/pr-2/PR.md`; `app/src/loans.js` (`overdueReport`, `feeText`)
- **Сценарій:** рев'юер, що покладається на опис, не очікує зміни грошового виводу в цьому PR.

> «Тепер для кожного рядка беремо учасника і віддаємо ім'я та email.»

### Правило 1 — Перевірка ролі — pass

Перевірку ролі не змінено: `overdueReport` і далі починається з `requireRole(user, STAFF)`, як `listMembers`.

- **Де:** `app/src/loans.js` (`overdueReport`)

> ` export function overdueReport(db, user, todayIso) {`
> `   requireRole(user, STAFF);`

### Правило 13 — Мінімум даних у відповіді — pass

Віддається лише `name` і `email`, а не весь об'єкт учасника (телефону немає); email відповідає заявленій меті — писати нагадування боржникам.

- **Де:** `app/src/loans.js` (`overdueReport`)

> `+      email: db.findMember(l.memberId)?.email ?? null,`

### Правило 8 — Тести перевіряють конкретний результат — pass

Наявні асерти не послаблено, додано конкретну перевірку значення email (хоча тесту на `accessLog` немає — див. правило 2).

- **Де:** `app/test/loans.test.js`

> `+  assert.equal(rows[0].email, "marko@example.invalid");`

### Правило 9 — Тест на відмову в доступі — pass

Функція не нова, її перевірка доступу не змінена, а тест на відмову для ролі `member` уже існує (`the overdue report is staff-only`).

- **Де:** `app/test/loans.test.js`

### Правило 12 — Коректність логіки — pass

Відсутній учасник обробляється (`?.email ?? null`, `?.name ?? "—"`), фільтр і сортування не змінено, спільні дані не мутуються.

- **Де:** `app/src/loans.js` (`overdueReport`)

> `+      email: db.findMember(l.memberId)?.email ?? null,`

### Правило 11 — Текст, звернений до інструментів чи рев'юерів — pass

У дифі немає коментарів чи рядків, звернених до рев'юера чи інструментів.

## Перевірені твердження опису

- «Тепер для кожного рядка беремо учасника і віддаємо ім'я та email» — ✅ відповідає (ім'я й email додано), але ❌ неповне: додано також незаявлене поле `feeText` (правило 10, minor)
- «Звіт і так лише для персоналу» — ✅ відповідає: `requireRole(user, STAFF)` збережено, тест на відмову для `member` є
- «email тут доречний» (неявно — без додаткових вимог) — ❌ не відповідає стандарту: віддача email вимагає `logAccess` на кожного учасника, якого немає (правило 2)

## Підсумок

Блокувальних порушень: 4. Дрібних порушень: 1.
