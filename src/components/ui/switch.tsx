import { cn } from '@/lib/utils';
import * as SwitchPrimitives from '@rn-primitives/switch';
import { Platform, Pressable, View } from 'react-native';

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitives.Root>) {
  const rootClassName = cn(
    'flex h-[1.15rem] w-8 shrink-0 flex-row items-center rounded-full border border-transparent shadow-sm shadow-black/5',
    Platform.select({
      web: 'focus-visible:border-ring focus-visible:ring-ring/50 peer inline-flex outline-none transition-all focus-visible:ring-[3px] disabled:cursor-not-allowed',
    }),
    props.checked ? 'bg-primary' : 'bg-input',
    props.disabled && 'opacity-50',
    className
  );
  const thumbClassName = cn(
    'size-4 rounded-full transition-transform',
    Platform.select({
      web: 'pointer-events-none block ring-0',
    }),
    props.checked ? 'bg-primary-foreground translate-x-3.5' : 'bg-switch-thumb translate-x-0'
  );

  // On web the primitives' own react-native components ignore className, so they render
  // through `asChild` onto this file's Pressable and View. Native keeps the primitives' elements.
  if (Platform.OS === 'web') {
    return (
      <SwitchPrimitives.Root asChild {...props}>
        <Pressable className={rootClassName}>
          <SwitchPrimitives.Thumb asChild>
            <View className={thumbClassName} />
          </SwitchPrimitives.Thumb>
        </Pressable>
      </SwitchPrimitives.Root>
    );
  }

  return (
    <SwitchPrimitives.Root className={rootClassName} {...props}>
      <SwitchPrimitives.Thumb className={thumbClassName} />
    </SwitchPrimitives.Root>
  );
}

export { Switch };
