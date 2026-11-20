import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Actions, e.g. a button. */
  children?: ReactNode;
}

/** A centred icon, title and line of help where a list or screen has nothing to show. */
export function EmptyState({ icon, title, description, children }: EmptyStateProps) {
  return (
    <View className="items-center gap-4 px-6 py-14">
      <View className="bg-muted size-12 items-center justify-center rounded-full">
        <Icon as={icon} className="text-muted-foreground size-6" />
      </View>
      <View className="max-w-sm items-center gap-1">
        <Text className="text-center text-base font-semibold">{title}</Text>
        {description ? <Text className="text-muted-foreground text-center text-sm">{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}
