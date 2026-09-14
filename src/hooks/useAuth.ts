/**
 * FitConnect — useAuth Hook
 *
 * Convenience hook that provides auth state and actions.
 */

import { useAppDispatch, useAppSelector } from '@store/hooks';
import { logout, selectCurrentUser, selectIsAuthenticated, selectAuthLoading } from '@store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  const isLoading = useAppSelector(selectAuthLoading);

  const handleLogout = () => {
    dispatch(logout());
  };

  return {
    isAuthenticated,
    currentUser,
    isLoading,
    logout: handleLogout,
  };
};
