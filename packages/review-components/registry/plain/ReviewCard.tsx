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
    <div className="rc-card">
      <div className="rc-card__header">
        <StarRating value={review.rating} size="sm" />
        <span className="rc-card__date">{formatRelative(review.createdAt)}</span>
      </div>
      <span className="rc-card__reviewer">{review.reviewerName}</span>
      <p className="rc-card__text">{review.text}</p>
    </div>
  );
}
