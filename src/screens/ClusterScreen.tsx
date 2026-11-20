import { Box, CircleAlert, Database, LogIn, Monitor, RefreshCw, Server, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { resourceStatus, StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { errorMessage } from '@/lib/errors';
import { formatBytes, formatPercent } from '@/lib/format';
import type { ClusterResource, ClusterResourceType } from '@/proxmox/types';
import { useClusterResources, useClusterStatus } from '@/query/hooks';
import { useSession, useSessions } from '@/session/sessions';
import { useProfiles } from '@/state/profiles';

const GROUPS: Array<{ title: string; type: ClusterResourceType; icon: LucideIcon }> = [
  { title: 'Nodes', type: 'node', icon: Server },
  { title: 'Virtual machines', type: 'qemu', icon: Monitor },
  { title: 'Containers', type: 'lxc', icon: Box },
  { title: 'Storage', type: 'storage', icon: Database },
];

interface ClusterScreenProps {
  clusterId: string;
  /** Login to view the cluster as; defaults to its first signed-in login. */
  loginId?: string;
  onBack: () => void;
}

export function ClusterScreen({ clusterId, loginId: requestedLoginId, onBack }: ClusterScreenProps) {
  const loginId = useLoginFor(clusterId, requestedLoginId);
  const session = useSession(loginId);
  const cluster = useProfiles((state) => state.clusters.find((candidate) => candidate.id === clusterId));
  const status = useClusterStatus(loginId);
  const resources = useClusterResources(loginId);

  const endpoint = cluster?.endpoints.find((candidate) => candidate.id === session?.endpointId);
  const summary = status.data?.find((entry) => entry.type === 'cluster');
  // Only a refresh the user asked for shows the spinner; the 15 s background polls stay silent
  // instead of pulling the list down each time.
  const [refreshing, setRefreshing] = useState(false);
  const refresh = () => {
    setRefreshing(true);
    void Promise.allSettled([status.refetch(), resources.refetch()]).finally(() => setRefreshing(false));
  };

  return (
    <View className="flex-1">
      <ScreenHeader
        title={cluster?.name ?? 'Cluster'}
        subtitle={session ? `${session.userId} via ${endpoint?.url.replace(/^https:\/\//, '') ?? '—'}` : 'Signed out'}
        onBack={onBack}>
        {summary ? <StatusBadge status={summary.quorate ? 'quorate' : 'no-quorum'} /> : null}
        <Button variant="ghost" size="icon" accessibilityLabel="Refresh" onPress={refresh} disabled={!session}>
          <Icon as={RefreshCw} className="size-4" />
        </Button>
      </ScreenHeader>

      {!session ? (
        <EmptyState
          icon={LogIn}
          title={cluster ? 'This login is signed out.' : 'This cluster isn’t saved here.'}
          description={cluster ? 'Sign in again from the cluster list to see its nodes, guests and storage.' : undefined}>
          <Button variant="outline" onPress={onBack}>
            <Text>Back to clusters</Text>
          </Button>
        </EmptyState>
      ) : (
        <ScrollView
          contentContainerClassName="w-full max-w-5xl gap-4 self-center p-4 pb-10 sm:p-6"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
          {resources.error ? (
            <View className="bg-status-error-surface flex-row items-center gap-3 rounded-lg px-4 py-3">
              <Icon as={CircleAlert} className="text-status-error size-4" />
              <Text className="text-status-error flex-1 text-sm">{errorMessage(resources.error)}</Text>
            </View>
          ) : null}
          {resources.isPending
            ? [0, 1, 2].map((key) => <Skeleton key={key} className="h-28 w-full rounded-xl" />)
            : GROUPS.map(({ title, type, icon }) => (
                <ResourceGroup
                  key={type}
                  title={title}
                  icon={icon}
                  rows={(resources.data ?? []).filter((row) => row.type === type && !row.template)}
                />
              ))}
        </ScrollView>
      )}
    </View>
  );
}

/** The requested login when it belongs to the cluster, else the cluster's first signed-in login. */
function useLoginFor(clusterId: string, requestedLoginId?: string): string {
  const logins = useProfiles((state) => state.logins);
  const sessions = useSessions((state) => state.sessions);
  const onCluster = logins.filter((login) => login.clusterId === clusterId);
  const login =
    onCluster.find((candidate) => candidate.id === requestedLoginId) ??
    onCluster.find((candidate) => sessions[candidate.id]) ??
    onCluster[0];
  return login?.id ?? '';
}

function ResourceGroup({ title, icon, rows }: { title: string; icon: LucideIcon; rows: ClusterResource[] }) {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => (a.vmid ?? 0) - (b.vmid ?? 0) || label(a).localeCompare(label(b)));
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <View className="bg-muted/50 flex-row items-center gap-2 px-4 py-2.5">
        <Icon as={icon} className="text-muted-foreground size-4" />
        <Text role="heading" aria-level="2" className="flex-1 text-sm font-semibold">
          {title}
        </Text>
        <View className="bg-background min-w-6 items-center rounded-full px-2 py-0.5">
          <Text className="text-muted-foreground text-xs font-medium tabular-nums">{rows.length}</Text>
        </View>
      </View>
      {sorted.map((row) => (
        <View key={row.id}>
          <Separator />
          <ResourceRow row={row} />
        </View>
      ))}
    </Card>
  );
}

function label(row: ClusterResource): string {
  if (row.type === 'storage') return row.storage ?? row.id;
  if (row.type === 'node') return row.node ?? row.id;
  return row.name ?? row.id;
}

function ResourceRow({ row }: { row: ClusterResource }) {
  const usage =
    row.type === 'storage'
      ? `${formatBytes(row.disk)} / ${formatBytes(row.maxdisk)}`
      : `CPU ${formatPercent(row.cpu)} · ${formatBytes(row.mem)} / ${formatBytes(row.maxmem)}`;
  const hasUsage = (row.type === 'storage' ? row.maxdisk : row.maxmem) != null;
  const node = row.type !== 'node' ? row.node : undefined;
  // Phones: node and usage share the line under the name. Wider screens: usage gets its own column.
  const details = [node, hasUsage ? usage : undefined].filter(Boolean).join(' · ');
  return (
    <View className="min-h-14 flex-row items-center gap-3 px-4 py-2.5">
      {row.vmid != null ? (
        <Text className="text-muted-foreground w-11 font-mono text-xs tabular-nums">
          {row.vmid}
        </Text>
      ) : null}
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="text-sm font-medium" numberOfLines={1}>
          {label(row)}
        </Text>
        {details ? (
          <Text className="text-muted-foreground text-xs tabular-nums sm:hidden" numberOfLines={1}>
            {details}
          </Text>
        ) : null}
        {node ? (
          <Text className="text-muted-foreground hidden text-xs sm:flex" numberOfLines={1}>
            {node}
          </Text>
        ) : null}
      </View>
      {hasUsage ? (
        <Text className="text-muted-foreground hidden text-xs tabular-nums sm:flex">{usage}</Text>
      ) : null}
      <StatusBadge status={resourceStatus(row)} className="sm:min-w-24" />
    </View>
  );
}
