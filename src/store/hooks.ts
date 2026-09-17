/**
 * FitConnect — Typed Redux Hooks
 *
 * Always use these instead of raw `useDispatch` / `useSelector`
 * to get full TypeScript type inference.
 *
 * Usage:
 *   const dispatch = useAppDispatch();
 *   const user = useAppSelector(selectCurrentUser);
 */

import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';

import type { AppDispatch, RootState } from './index';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
