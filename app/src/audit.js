// Access log for personal data. Team rule (docs/team-conventions.md): every
// function that returns a member's email or phone records who read it and why.

export function logAccess(db, user, memberId, purpose) {
  db.accessLog.push({ at: new Date().toISOString(), by: user?.id ?? null, memberId, purpose });
}
