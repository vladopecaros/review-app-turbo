import { z } from 'zod';

export const createPublicReviewSchema = z.object({
  rating: z
    .number({ error: 'Rating must be an integer between 1 and 5' })
    .int('Rating must be an integer between 1 and 5')
    .min(1, 'Rating must be an integer between 1 and 5')
    .max(5, 'Rating must be an integer between 1 and 5'),
  text: z
    .string()
    .trim()
    .min(1, 'Review text is required')
    .max(5000, 'Review text must be 5000 characters or less'),
  reviewerName: z.string().trim().min(1, 'Reviewer name is required'),
  reviewerEmail: z
    .string()
    .email('Reviewer email must be a valid email address'),
  externalProductId: z
    .string()
    .trim()
    .min(1, 'externalProductId must be a non-empty string')
    .optional()
    .nullable(),
});

export type CreatePublicReviewInput = z.infer<typeof createPublicReviewSchema>;
