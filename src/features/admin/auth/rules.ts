export type AdminRole = "OWNER" | "EDITOR" | "VIEWER";

export function roleAllows(role: AdminRole, required: "READ" | "EDIT" | "OWNER") {
  if (required === "READ") return true;
  if (required === "EDIT") return role === "OWNER" || role === "EDITOR";
  return role === "OWNER";
}

export function sameOrigin(originHeader: string | null, expectedOrigin: string) {
  if (!originHeader || originHeader === "null") return false;
  try { return new URL(originHeader).origin === new URL(expectedOrigin).origin; } catch { return false; }
}
