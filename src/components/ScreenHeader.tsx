import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Shows a back button. */
  onBack?: () => void;
  /** Before the title, e.g. the brand mark. */
  leading?: ReactNode;
  /** Actions on the right. */
  children?: ReactNode;
}

/** The bar at the top of every screen: back button, title and subtitle, actions. */
export function ScreenHeader({ title, subtitle, onBack, leading, children }: ScreenHeaderProps) {
  return (
    <View className="bg-card border-border min-h-14 flex-row items-center gap-2 border-b px-2 py-2 sm:px-4">
      {onBack ? (
        <Button variant="ghost" size="icon" accessibilityLabel="Back" onPress={onBack}>
          <Icon as={ChevronLeft} />
        </Button>
      ) : null}
      {leading}
      <View className="min-w-0 flex-1 px-1">
        <Text role="heading" aria-level="1" className="text-base font-semibold" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-muted-foreground text-xs" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children ? <View className="flex-row items-center gap-1.5">{children}</View> : null}
    </View>
  );
}
