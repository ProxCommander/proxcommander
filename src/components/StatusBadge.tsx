import {
  CircleCheck,
  CircleDashed,
  CircleMinus,
  CirclePause,
  CirclePlay,
  CircleStop,
  CircleX,
  Moon,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { ClusterResource } from '@/proxmox/types';

export type StatusTone = 'ok' | 'stopped' | 'warning' | 'error' | 'unknown';

export type Status =
  | 'online'
  | 'offline'
  | 'running'
  | 'stopped'
  | 'paused'
  | 'suspended'
  | 'available'
  | 'unavailable'
  | 'quorate'
  | 'no-quorum'
  | 'signed-in'
  | 'signed-out'
  | 'unknown';

/** Every status has its own icon shape, a tone (colour) and a word, so none relies on colour alone. */
const STATUS: Record<Status, { label: string; tone: StatusTone; icon: LucideIcon }> = {
  online: { label: 'Online', tone: 'ok', icon: CircleCheck },
  offline: { label: 'Offline', tone: 'error', icon: CircleX },
  running: { label: 'Running', tone: 'ok', icon: CirclePlay },
  stopped: { label: 'Stopped', tone: 'stopped', icon: CircleStop },
  paused: { label: 'Paused', tone: 'warning', icon: CirclePause },
  suspended: { label: 'Suspended', tone: 'warning', icon: Moon },
  available: { label: 'Available', tone: 'ok', icon: CircleCheck },
  unavailable: { label: 'Unavailable', tone: 'error', icon: CircleX },
  quorate: { label: 'Quorate', tone: 'ok', icon: CircleCheck },
  'no-quorum': { label: 'No quorum', tone: 'error', icon: TriangleAlert },
  'signed-in': { label: 'Signed in', tone: 'ok', icon: CircleCheck },
  'signed-out': { label: 'Signed out', tone: 'stopped', icon: CircleMinus },
  unknown: { label: 'Unknown', tone: 'unknown', icon: CircleDashed },
};

// Full class names, so Tailwind finds them. Unknown has no fill, only a dashed outline, so it
// reads differently from stopped at a glance.
const TONE: Record<StatusTone, { surface: string; foreground: string }> = {
  ok: { surface: 'bg-status-ok-surface border-transparent', foreground: 'text-status-ok' },
  stopped: { surface: 'bg-status-stopped-surface border-transparent', foreground: 'text-status-stopped' },
  warning: { surface: 'bg-status-warning-surface border-transparent', foreground: 'text-status-warning' },
  error: { surface: 'bg-status-error-surface border-transparent', foreground: 'text-status-error' },
  unknown: { surface: 'border-status-unknown border-dashed bg-transparent', foreground: 'text-status-unknown' },
};

/** The status of a node, guest or storage row of `/cluster/resources`. */
export function resourceStatus(row: Pick<ClusterResource, 'type' | 'status' | 'lock'>): Status {
  switch (row.type) {
    case 'node':
      return row.status === 'online' || row.status === 'offline' ? row.status : 'unknown';
    case 'qemu':
    case 'lxc':
      if (row.lock === 'suspended') return 'suspended';
      return row.status === 'running' || row.status === 'stopped' || row.status === 'paused' || row.status === 'suspended'
        ? row.status
        : 'unknown';
    case 'storage':
      return row.status === 'available' || row.status === 'unavailable' ? row.status : 'unknown';
    default:
      return 'unknown';
  }
}

interface StatusBadgeProps {
  status: Status;
  /** Overrides the status word, e.g. with a more specific one. */
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const { icon, tone, label: word } = STATUS[status];
  const { surface, foreground } = TONE[tone];
  return (
    <View className={cn('shrink-0 flex-row items-center gap-1 rounded-full border py-px pl-1.5 pr-2', surface, className)}>
      <Icon as={icon} className={cn('size-3.5', foreground)} strokeWidth={2.25} />
      <Text className={cn('text-xs font-medium', foreground)} numberOfLines={1}>
        {label ?? word}
      </Text>
    </View>
  );
}
