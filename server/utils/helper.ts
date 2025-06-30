import { User } from "@shared/schema";

export function sanitizeUser(user: User) {
  const { password,resetToken, ...safeUser } = user;
  return safeUser;
}
