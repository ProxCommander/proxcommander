import { cn } from '@/lib/utils';
import * as SwitchPrimitives from '@rn-primitives/switch';
import { Platform, Pressable, View } from 'react-native';

// The primitives render through `asChild` onto this file's Pressable and View: imported here,
// they take `className` on every platform, which the primitives' own copies don't on web.
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitives.Root>) {
  return (
    <SwitchPrimitives.Root asChild {...props}>
      <Pressable
        className={cn(
          'flex h-[1.15rem] w-8 shrink-0 flex-row items-center rounded-full border border-transparent shadow-sm shadow-black/5',
          Platform.select({
            web: 'focus-visible:border-ring focus-visible:ring-ring/50 peer inline-flex outline-none transition-all focus-visible:ring-[3px] disabled:cursor-not-allowed',
          }),
          props.checked ? 'bg-primary' : 'bg-input dark:bg-input/80',
          props.disabled && 'opacity-50',
          className
        )}>
        <SwitchPrimitives.Thumb asChild>
          <View
            className={cn(
              'bg-card size-4 rounded-full transition-transform',
              Platform.select({
                web: 'pointer-events-none block ring-0',
              }),
              props.checked
                ? 'dark:bg-primary-foreground translate-x-3.5'
                : 'dark:bg-foreground translate-x-0'
            )}
          />
        </SwitchPrimitives.Thumb>
      </Pressable>
    </SwitchPrimitives.Root>
  );
}

export { Switch };
