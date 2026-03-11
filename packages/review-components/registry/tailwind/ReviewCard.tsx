import type { PublicReview } from '../../shared/types';
import { StarRating } from './StarRating';

function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const timestamp = new Date(dateStr).getTime();
  if (!Number.isFinite(timestamp)) return '';
  const diff = Date.now() - timestamp;
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const minutes = Math.round(diff / 60_000);
  if (Math.abs(minutes) < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.round(diff / 3_600_000);
  if (Math.abs(hours) < 24) return rtf.format(-hours, 'hour');
  const days = Math.round(diff / 86_400_000);
  if (Math.abs(days) < 30) return rtf.format(-days, 'day');
  const months = Math.round(diff / 2_592_000_000);
  if (Math.abs(months) < 12) return rtf.format(-months, 'month');
  return rtf.format(-Math.round(diff / 31_536_000_000), 'year');
}

interface ReviewCardProps {
  review: PublicReview;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3 w-full max-w-[72rem] mx-auto">
      <div className="flex items-center justify-between gap-3">
        <StarRating value={review.rating} size="sm" />
        <span className="text-xs text-[#8a98ab]">{formatRelative(review.createdAt)}</span>
      </div>
      <span className="text-sm font-medium text-[#e8edf5]">{review.reviewerName}</span>
      <p className="text-sm text-[#e8edf5] leading-relaxed">{review.text}</p>
    </div>
  );
}
