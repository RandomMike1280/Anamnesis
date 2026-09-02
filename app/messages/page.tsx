import { Suspense } from 'react';
import { LoadingPage } from '@/components/ui/Loading';
import { MessagesContent } from './MessagesContent';

export default function MessagesPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <MessagesContent />
    </Suspense>
  );
}
