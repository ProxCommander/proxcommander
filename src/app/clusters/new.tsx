import { router } from 'expo-router';

import { goBack } from '@/lib/navigation';
import { AddClusterScreen } from '@/screens/AddClusterScreen';

export default function AddClusterRoute() {
  return (
    <AddClusterScreen
      onCancel={goBack}
      onCreated={(loginId) => router.dismissTo({ pathname: '/', params: { signIn: loginId } })}
    />
  );
}
