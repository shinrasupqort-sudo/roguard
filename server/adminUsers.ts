// simple list of email addresses that should be granted the "admin" role
// when they register.  This avoids hard‑coding roles in the database and
// lets you manage the list in a single file.

export const adminEmails = new Set<string>([
  // add addresses here you want to be able to access /admin
  // e.g. "admin@example.com",
]);

export function isAdminEmail(email: string): boolean {
  return adminEmails.has(email.trim().toLowerCase());
}
