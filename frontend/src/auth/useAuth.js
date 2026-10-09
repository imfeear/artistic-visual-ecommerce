import { useContext } from 'react';
import { AuthCtx } from './authStore';
export const useAuth = () => useContext(AuthCtx);
