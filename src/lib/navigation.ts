import { router } from 'expo-router';

/** Back one screen, or to the cluster list when there is nothing to go back to. */
export function goBack(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
