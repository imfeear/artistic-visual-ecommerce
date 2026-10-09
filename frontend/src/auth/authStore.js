import { createContext } from 'react';
export const AuthCtx = createContext(null);
export const emptyAuth = { username: '', password: '', ok: false };
export function readAuth() {
  try {
    return JSON.parse(localStorage.getItem('adminAuth')) || emptyAuth;
  } catch {
    return emptyAuth;
  }
}
