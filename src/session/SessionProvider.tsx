import { useEffect, type PropsWithChildren, type ReactNode } from 'react';
import { AppState, View } from 'react-native';

import { isWeb } from '../storage/backends';
import { followOtherTabs, hydrateSessions, maintainSessions, markActive, useSessions } from './sessions';

const MAINTENANCE_INTERVAL_MS = 30_000;
const WEB_INPUT_EVENTS = ['pointerdown', 'keydown', 'wheel'] as const;

/**
 * Restores sessions, enforces their timeout rules, and records user input as
 * activity for idle timeouts. Always renders its children, so static web
 * rendering has content; wrap anything that reads stored profiles or sessions
 * in `SessionsReady`.
 */
export function SessionProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    void hydrateSessions();
    const timer = setInterval(() => void maintainSessions(), MAINTENANCE_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void maintainSessions();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isWeb) return;
    const onInput = () => markActive();
    WEB_INPUT_EVENTS.forEach((event) => window.addEventListener(event, onInput, { capture: true, passive: true }));
    const stopFollowing = followOtherTabs();
    return () => {
      WEB_INPUT_EVENTS.forEach((event) => window.removeEventListener(event, onInput, { capture: true }));
      stopFollowing();
    };
  }, []);

  return (
    <View style={{ flex: 1 }} onTouchStartCapture={isWeb ? undefined : () => markActive()}>
      {children}
    </View>
  );
}

/**
 * Renders its children once stored profiles and sessions are restored and
 * expired sessions settled, and `fallback` until then. Restoring only happens
 * in the app, never during static web rendering, so the pre-rendered HTML
 * holds the fallback.
 */
export function SessionsReady({ children, fallback = null }: PropsWithChildren<{ fallback?: ReactNode }>) {
  const hydrated = useSessions((state) => state.hydrated);
  return hydrated ? children : fallback;
}
