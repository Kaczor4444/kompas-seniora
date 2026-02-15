'use client';

import { useReturnVisitor } from '@/src/hooks/useReturnVisitor';

export default function ReturnVisitorTracker() {
  useReturnVisitor();
  return null;
}
