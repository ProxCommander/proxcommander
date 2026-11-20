import { LogIn, LogOut, Plus, Server, Trash2, TriangleAlert } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { describePolicy, SESSION_END_LABEL } from '@/lib/format';
import { userId, type Login } from '@/models';
import { SessionsReady } from '@/session/SessionProvider';
import { signOut, useSessions } from '@/session/sessions';
import { removeCluster, removeLogin, useProfiles } from '@/state/profiles';
import { SignInDialog } from './SignInDialog';

interface ClustersScreenProps {
  /** Login whose sign-in dialog is open, if any. */
  signInLoginId: string | null;
  onSignIn: (loginId: string) => void;
  onCloseSignIn: () => void;
  onAddCluster: () => void;
  onOpenLogin: (login: Login) => void;
}

export function ClustersScreen({ signInLoginId, onSignIn, onCloseSignIn, onAddCluster, onOpenLogin }: ClustersScreenProps) {
  return (
    <View className="flex-1">
      <ScreenHeader title="ProxCommander" leading={<BrandMark className="ml-1" />}>
        <Button size="sm" onPress={onAddCluster}>
          <Icon as={Plus} className="size-4" />
          <Text>Add cluster</Text>
        </Button>
      </ScreenHeader>

      <ScrollView contentContainerClassName="w-full max-w-3xl gap-3 self-center px-4 pb-safe-offset-10 pt-6 sm:pt-10">
        <View className="gap-1.5 pb-3">
          <Text role="heading" aria-level="2" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome to ProxCommander
          </Text>
          <Text className="text-muted-foreground text-sm leading-5 sm:text-base">
            Manage your Proxmox VE clusters: sign in to one or more logins and see nodes, guests and storage at a glance.
          </Text>
        </View>

        {/* Stored clusters and sessions load in the app only, never in the pre-rendered page. */}
        <SessionsReady>
          <ClusterList onSignIn={onSignIn} onOpenLogin={onOpenLogin} onAddCluster={onAddCluster} />
        </SessionsReady>
      </ScrollView>

      <SessionsReady>
        <SignInDialog loginId={signInLoginId} onClose={onCloseSignIn} />
      </SessionsReady>
    </View>
  );
}

function ClusterList({ onSignIn, onOpenLogin, onAddCluster }: Pick<ClustersScreenProps, 'onSignIn' | 'onOpenLogin' | 'onAddCluster'>) {
  const clusters = useProfiles((state) => state.clusters);
  const logins = useProfiles((state) => state.logins);
  const lastEnded = useSessions((state) => state.lastEnded);

  const endedLogin = lastEnded && lastEnded.reason !== 'signed-out' && logins.find((l) => l.id === lastEnded.loginId);

  return (
    <>
      {endedLogin ? (
        <View className="bg-status-warning-surface flex-row items-center gap-3 rounded-lg px-4 py-3">
          <Icon as={TriangleAlert} className="text-status-warning size-4" />
          <Text className="flex-1 text-sm">
            {userId(endedLogin)} was signed out: {SESSION_END_LABEL[lastEnded.reason]}.
          </Text>
        </View>
      ) : null}

      {clusters.length === 0 ? (
        <Card className="border-dashed py-0 shadow-none">
          <EmptyState
            icon={Server}
            title="No clusters yet"
            description="Add a Proxmox VE cluster and its addresses to get started.">
            <Button variant="outline" onPress={onAddCluster}>
              <Icon as={Plus} className="size-4" />
              <Text>Add a cluster</Text>
            </Button>
          </EmptyState>
        </Card>
      ) : (
        <SectionLabel className="px-1">Clusters</SectionLabel>
      )}

      {clusters.map((cluster) => (
        <Card key={cluster.id} className="gap-0 overflow-hidden py-0">
          <View className="flex-row items-center gap-3 px-4 py-3">
            <View className="bg-muted size-10 items-center justify-center rounded-lg">
              <Icon as={Server} className="text-muted-foreground size-5" />
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text className="text-base font-semibold">{cluster.name}</Text>
                {!cluster.rememberHostnames ? <Badge variant="accent"><Text>Not saved</Text></Badge> : null}
              </View>
              <Text className="text-muted-foreground font-mono text-xs" numberOfLines={1}>
                {cluster.endpoints.map((endpoint) => endpoint.url.replace(/^https:\/\//, '')).join(' · ')}
              </Text>
            </View>
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel={`Remove ${cluster.name}`}
              onPress={() => removeCluster(cluster.id)}>
              <Icon as={Trash2} className="text-muted-foreground size-4" />
            </Button>
          </View>
          {logins
            .filter((login) => login.clusterId === cluster.id)
            .map((login) => (
              <View key={login.id} className="bg-background/40">
                <Separator />
                <LoginRow
                  login={login}
                  onOpen={() => onOpenLogin(login)}
                  onSignIn={() => onSignIn(login.id)}
                />
              </View>
            ))}
        </Card>
      ))}
    </>
  );
}

interface LoginRowProps {
  login: Login;
  onOpen: () => void;
  onSignIn: () => void;
}

function LoginRow({ login, onOpen, onSignIn }: LoginRowProps) {
  const session = useSessions((state) => state.sessions[login.id]);
  return (
    <View className="flex-row flex-wrap items-center gap-x-2 gap-y-2 px-4 py-3">
      <View className="min-w-48 flex-1 gap-1">
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="font-mono text-sm font-medium">
            {login.authMethod === 'token' ? `${userId(login)}!${login.tokenName}` : userId(login)}
          </Text>
          <StatusBadge status={session ? 'signed-in' : 'signed-out'} />
        </View>
        <Text className="text-muted-foreground text-xs">
          {describePolicy(login.sessionPolicy)}
        </Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        {session ? (
          <>
            <Button size="sm" onPress={onOpen}>
              <Text>Open</Text>
            </Button>
            <Button size="sm" variant="ghost" onPress={() => signOut(login.id)}>
              <Icon as={LogOut} className="size-4" />
              <Text>Sign out</Text>
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onPress={onSignIn}>
            <Icon as={LogIn} className="size-4" />
            <Text>Sign in</Text>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel={`Remove ${userId(login)}`}
          onPress={() => removeLogin(login.id)}>
          <Icon as={Trash2} className="text-muted-foreground size-4" />
        </Button>
      </View>
    </View>
  );
}
