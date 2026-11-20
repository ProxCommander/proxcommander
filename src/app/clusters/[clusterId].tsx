import { useLocalSearchParams } from 'expo-router';

import { goBack } from '@/lib/navigation';
import { ClusterScreen } from '@/screens/ClusterScreen';
import { SessionsReady } from '@/session/SessionProvider';

export default function ClusterRoute() {
  // `?login=<loginId>` picks which login on the cluster to view; without it, the first signed-in one.
  const { clusterId, login } = useLocalSearchParams<{ clusterId: string; login?: string }>();

  // Stored sessions restore in the browser only, so this view has nothing to pre-render.
  return (
    <SessionsReady>
      <ClusterScreen clusterId={clusterId} loginId={login} onBack={goBack} />
    </SessionsReady>
  );
}
