import { Badge } from '@/components/ui';

export interface SocialProofProps {
  ordersCount?: number | null;
}

export function SocialProof({ ordersCount }: SocialProofProps) {
  if (ordersCount != null && ordersCount > 0) {
    return (
      <p className="font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em] text-fg-muted">
        {ordersCount} bought in the last thirty days
      </p>
    );
  }

  return <Badge variant="neutral">Popular this season</Badge>;
}

export default SocialProof;
