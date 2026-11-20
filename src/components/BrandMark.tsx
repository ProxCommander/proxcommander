import { Image } from 'react-native';

import { cn } from '@/lib/utils';

const logo = require('../../assets/brand/logo-512.png');

/** The ProxCommander logo as a small square mark. Decorative: the name is always next to it. */
export function BrandMark({ className }: { className?: string }) {
  return <Image source={logo} className={cn('size-8 rounded-lg', className)} accessible={false} alt="" />;
}
