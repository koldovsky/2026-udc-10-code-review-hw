// Authentication is out of scope: the caller arrives as { id, role }.
// Authorization is in scope — every function that exposes data checks the role.

export class AccessDenied extends Error {
  constructor(message = "access denied") {
    super(message);
    this.name = "AccessDenied";
    this.status = 403;
  }
}

export const STAFF = ["librarian", "admin"];

export function requireRole(user, roles) {
  if (!user || !roles.includes(user.role)) throw new AccessDenied();
}

export function isStaff(user) {
  return Boolean(user) && STAFF.includes(user.role);
}
