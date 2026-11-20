import { router, useLocalSearchParams } from 'expo-router';

import { ClustersScreen } from '@/screens/ClustersScreen';

export default function ClustersRoute() {
  // `?signIn=<loginId>` opens the sign-in dialog, e.g. right after adding a cluster.
  const { signIn } = useLocalSearchParams<{ signIn?: string }>();

  return (
    <ClustersScreen
      signInLoginId={signIn ?? null}
      onSignIn={(loginId) => router.setParams({ signIn: loginId })}
      onCloseSignIn={() => router.setParams({ signIn: undefined })}
      onAddCluster={() => router.push('/clusters/new')}
      onOpenLogin={(login) =>
        router.push({ pathname: '/clusters/[clusterId]', params: { clusterId: login.clusterId, login: login.id } })
      }
    />
  );
}
