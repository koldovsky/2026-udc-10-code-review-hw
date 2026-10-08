import test from "node:test";
import assert from "node:assert/strict";
import { createDb } from "../src/db.js";
import { listMembers, memberCard } from "../src/members.js";
import { AccessDenied } from "../src/auth.js";

const olya = { id: 1, role: "member" };
const iryna = { id: 3, role: "librarian" };

test("the member directory is staff-only and has no contact details", () => {
  const rows = listMembers(createDb(), iryna);
  assert.equal(rows.length, 5);
  assert.deepEqual(Object.keys(rows[0]).sort(), ["id", "name", "role"]);
  assert.throws(() => listMembers(createDb(), olya), AccessDenied);
});

test("a member reads their own card", () => {
  const card = memberCard(createDb(), olya, 1);
  assert.equal(card.email, "olya@example.invalid");
});

test("a member cannot read someone else's card", () => {
  assert.throws(() => memberCard(createDb(), olya, 2), AccessDenied);
});

test("reading a card is recorded in the access log", () => {
  const db = createDb();
  memberCard(db, iryna, 2);
  assert.deepEqual(db.accessLog.map((e) => [e.by, e.memberId, e.purpose]), [[3, 2, "member-card"]]);
});

test("staff read any card", () => {
  assert.equal(memberCard(createDb(), iryna, 2).name, "Тарас Приклад");
});
