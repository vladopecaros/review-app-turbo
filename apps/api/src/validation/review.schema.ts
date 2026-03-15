import { z } from 'zod';

export const updateReviewStatusSchema = z.object({
  status: z.enum(['published', 'pending', 'rejected'] as const, {
    error: 'Status must be one of published, pending, or rejected',
  }),
});

export type UpdateReviewStatusInput = z.infer<typeof updateReviewStatusSchema>;
