# Рев'ю PR-4: Винести хелпери дат у src/dates.js

## Вердикт
можна зливати — це чистий рефакторинг. `toUtcMs`, `daysBetween` і `addDays` перенесено в `dates.js` без зміни поведінки, `loans.js` і далі реекспортує `daysBetween` і `addDays`, у CHANGELOG є точний запис, тести зелені. Знахідок немає.

## Тести
- `git status --short app` — порожньо
- `git apply --check review-queue/pr-4/change.diff` — застосовується
- `git apply review-queue/pr-4/change.diff` — застосовано
- `npm --prefix app test` — 16 пройдено, 0 впало (base: 13). Додалося 3 нові тести з `test/dates.test.js`.
- Відновлення: `git checkout -- app`, `git clean -fd app` (видалено `app/src/dates.js`, `app/test/dates.test.js`), `git status --short app` — порожньо

## Знахідки
Немає.

## Потребує рішення людини
немає

## Поза PR
- `app/src/loans.js` — `listLoans` повертає розгорнутий `{ ...l }` без пагінації, а `overdueReport` — необмежений список. Усередині `.map` там викликається лінійний `db.findBook(l.bookId)`. Це наявний код base, PR його не торкається (правила 7, 17, 19).
- `toUtc`/`toUtcMs` не перевіряють формат входу: на рядку не у форматі `YYYY-MM-DD` вони мовчки повертають `NaN`, і тоді `addDays` кидає `RangeError` з `toISOString`. Ця поведінка така сама, як у base. PR лише переносить її і робить `toUtcMs` експортованою (правило 13).

## Перевірка правил
- Порушено: —
- Пройдено: 5, 6, 8, 10, 11, 12, 14, 16, 19
- Не стосується: 1, 2, 3, 4, 7, 9, 13, 15, 17, 18
