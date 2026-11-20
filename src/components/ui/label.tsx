import { cn } from '@/lib/utils';
import * as LabelPrimitive from '@rn-primitives/label';
import { Platform, Pressable, Text as RNText } from 'react-native';

// The primitives render through `asChild` onto this file's Pressable and Text: imported here,
// they take `className` on every platform, which the primitives' own copies don't on web.
function Label({
  className,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled,
  nativeID,
  children,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Text>) {
  return (
    <LabelPrimitive.Root
      asChild
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}>
      <Pressable
        className={cn(
          'flex select-none flex-row items-center gap-2',
          Platform.select({
            web: 'cursor-default leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
          }),
          disabled && 'opacity-50'
        )}>
        <LabelPrimitive.Text asChild nativeID={nativeID}>
          <RNText
            className={cn(
              'text-foreground text-sm font-medium',
              Platform.select({ web: 'leading-none' }),
              className
            )}
            {...props}>
            {children}
          </RNText>
        </LabelPrimitive.Text>
      </Pressable>
    </LabelPrimitive.Root>
  );
}

export { Label };
