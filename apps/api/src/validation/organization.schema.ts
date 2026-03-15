import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(3, 'Organization name must be more than 3 characters long'),
  slug: z
    .string()
    .min(3, 'Organization slug must be more than 3 characters long'),
});

export const inviteUserSchema = z
  .object({
    invitedUserId: z.string().optional(),
    invitedUserEmail: z
      .string()
      .email('Invited user email is not in correct format')
      .optional(),
    invitedUserRole: z.enum(['admin', 'member'] as const, {
      error: 'Invited user role must be admin or member',
    }),
  })
  .refine((data) => data.invitedUserId || data.invitedUserEmail, {
    message: 'Either invitedUserId or invitedUserEmail is required',
  });

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
