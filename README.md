# UDC Workshop 10 — Code Review з AI

- **Слайди:** <https://koldovsky.github.io/2026-udc-10-code-review-slidev/>
- **Повні інструкції:** [`docs/walkthrough.md`](docs/walkthrough.md)
- **Ключ відповідей** (клонувати лише після прогонів рев'юера в Task B):
  <https://github.com/koldovsky/2026-udc-10-code-review-hw-answers>

Домашнє завдання: побудувати свій **AI-review flow** — стандарт, конфіг рев'юера,
прогін по черзі з шести pull request-ів, чесний рахунок precision і recall, пайплайн.

## Швидкий старт

```bash
gh repo fork koldovsky/2026-udc-10-code-review-hw --clone
cd 2026-udc-10-code-review-hw
git checkout -b ws10/<github-username>

cd app && npm test && cd ..
```

13 зелених тестів. `npm install` не потрібен — у застосунку немає npm-залежностей.
Потрібно: Node 22+ і GitHub account. **Жодних API-ключів.**

## Що вже є

| Шлях | Що це |
|---|---|
| `app/` | Сервіс бібліотеки громади — код **до** змін |
| `review-queue/pr-1` … `pr-6` | Шість PR на рев'ю: `PR.md` + `change.diff` |
| `docs/team-conventions.md` | Домовленості команди — на чому вона блокує злиття |
| `docs/templates/` | Шаблони для документів домашки |

## Що робите ви

- **Task A** — стандарт рев'ю і конфіг рев'юера
- **Task B** — прогін по черзі, рахунок за ключем: precision і recall
- **Task C** — підналаштувати так, щоб покращення узагальнювалось
- **Task D** — пайплайн у CI з безпечними налаштуваннями
- **Task E** (бонус) — пайплайн по-справжньому / стабільність / два рев'юери

## Здача

Pull Request із назвою `WS10: <ім'я>`. CodeRabbit зробить авто-рев'ю за чек-лістом
із [`docs/walkthrough.md`](docs/walkthrough.md).
