export const ADMIN_EMAIL = 'admin@gmail.com';
export const ADMIN_PASSWORD = 'bauka061011';

export function isAdminEmail(email) {
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

export function isValidAdminLogin(email, password) {
  return isAdminEmail(email) && password === ADMIN_PASSWORD;
}
