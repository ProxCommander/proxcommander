import { cn } from '@/lib/utils';
import * as LabelPrimitive from '@rn-primitives/label';
import { Platform, Pressable, Text as RNText } from 'react-native';

function Label({
  className,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Text>) {
  const rootClassName = cn(
    'flex select-none flex-row items-center gap-2',
    Platform.select({
      web: 'cursor-default leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
    }),
    disabled && 'opacity-50'
  );
  const textClassName = cn(
    'text-foreground text-sm font-medium',
    Platform.select({ web: 'leading-none' }),
    className
  );
  const press = { onPress, onLongPress, onPressIn, onPressOut, disabled };

  // On web the primitives' own react-native components ignore className, so they render
  // through `asChild` onto this file's Pressable and Text. Native keeps the primitives' elements.
  if (Platform.OS === 'web') {
    const { nativeID, children, ...textProps } = props;
    return (
      <LabelPrimitive.Root asChild {...press}>
        <Pressable className={rootClassName}>
          <LabelPrimitive.Text asChild nativeID={nativeID}>
            <RNText className={textClassName} {...textProps}>
              {children}
            </RNText>
          </LabelPrimitive.Text>
        </Pressable>
      </LabelPrimitive.Root>
    );
  }

  return (
    <LabelPrimitive.Root className={rootClassName} {...press}>
      <LabelPrimitive.Text className={textClassName} {...props} />
    </LabelPrimitive.Root>
  );
}

export { Label };
