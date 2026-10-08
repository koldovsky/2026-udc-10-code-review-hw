// In-memory store with synthetic seed data. A fresh store per call, so every
// test starts from the same state.

export function createDb() {
  const members = [
    { id: 1, name: "Оля Приклад", email: "olya@example.invalid", phone: "+380000000001", role: "member" },
    { id: 2, name: "Тарас Приклад", email: "taras@example.invalid", phone: "+380000000002", role: "member" },
    { id: 3, name: "Ірина Бібліотекарка", email: "iryna@example.invalid", phone: "+380000000003", role: "librarian" },
    { id: 4, name: "Адмін Системи", email: "admin@example.invalid", phone: "+380000000004", role: "admin" },
    { id: 5, name: "Марко Приклад", email: "marko@example.invalid", phone: "+380000000005", role: "member" },
  ];

  const books = [
    { id: 101, title: "Кобзар", author: "Тарас Шевченко" },
    { id: 102, title: "Тіні забутих предків", author: "Михайло Коцюбинський" },
    { id: 103, title: "Лісова пісня", author: "Леся Українка" },
    { id: 104, title: "Захар Беркут", author: "Іван Франко" },
    { id: 105, title: "Intermezzo", author: "Михайло Коцюбинський" },
    { id: 106, title: "Місто", author: "Валер'ян Підмогильний" },
  ];

  // Dates are YYYY-MM-DD strings; returned_at is null while the book is out.
  const loans = [
    { id: 1, memberId: 1, bookId: 101, takenAt: "2026-09-01", dueAt: "2026-09-15", returnedAt: "2026-09-14" },
    { id: 2, memberId: 1, bookId: 102, takenAt: "2026-09-10", dueAt: "2026-09-24", returnedAt: null },
    { id: 3, memberId: 2, bookId: 103, takenAt: "2026-09-05", dueAt: "2026-09-19", returnedAt: null },
    { id: 4, memberId: 2, bookId: 104, takenAt: "2026-09-20", dueAt: "2026-10-04", returnedAt: "2026-10-07" },
    { id: 5, memberId: 5, bookId: 105, takenAt: "2026-09-25", dueAt: "2026-10-09", returnedAt: null },
    { id: 6, memberId: 5, bookId: 106, takenAt: "2026-09-02", dueAt: "2026-09-16", returnedAt: null },
    { id: 7, memberId: 1, bookId: 103, takenAt: "2026-08-01", dueAt: "2026-08-15", returnedAt: "2026-08-20" },
  ];

  const accessLog = []; // see src/audit.js
  let nextLoanId = loans.length + 1;

  return {
    members,
    books,
    loans,
    accessLog,
    findMember(id) {
      return members.find((m) => m.id === id) ?? null;
    },
    findBook(id) {
      return books.find((b) => b.id === id) ?? null;
    },
    addLoan(loan) {
      const row = { id: nextLoanId++, returnedAt: null, ...loan };
      loans.push(row);
      return row;
    },
  };
}
