import { AccessDenied, isStaff, requireRole, STAFF } from "./auth.js";
import { logAccess } from "./audit.js";

/** Staff-only directory: names and roles, no contact details. */
export function listMembers(db, user) {
  requireRole(user, STAFF);
  return db.members.map(({ id, name, role }) => ({ id, name, role }));
}

/** A member may read their own card; staff may read anyone's. */
export function memberCard(db, user, id) {
  if (!user) throw new AccessDenied();
  if (!isStaff(user) && user.id !== id) throw new AccessDenied();
  const m = db.findMember(id);
  if (!m) return null;
  logAccess(db, user, m.id, "member-card");
  return { id: m.id, name: m.name, email: m.email, phone: m.phone };
}
