import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/** A small upper-case heading above a group of cards or rows. */
export function SectionLabel({ children, className }: { children: string; className?: string }) {
  return (
    <Text role="heading" aria-level="2" className={cn('text-muted-foreground text-xs font-semibold uppercase tracking-wider', className)}>
      {children}
    </Text>
  );
}
