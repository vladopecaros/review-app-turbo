import { EnvironmentVariables } from '../../../helpers/env/environmentVariables';

export const organizationInviteTemplate = (
  organizationName: string,
  role: string,
  invitationId: string,
) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Organization Invitation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f7fa;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 48px 40px 32px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                  <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                    You're Invited!
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1a202c; line-height: 1.4;">
                    Join ${organizationName} as ${role}
                  </h2>

                  <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                    Great news! You've been invited to become a <strong>${role}</strong> at <strong>${organizationName}</strong>. The team is excited to have you on board.
                  </p>

                  <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                    Head over to your dashboard to accept the invitation and start collaborating with your new team:
                  </p>

                  <!-- Button -->
                  <table role="presentation" style="margin: 0 auto; border-collapse: collapse;">
                    <tr>
                      <td style="border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                        <a href="${EnvironmentVariables.FRONTEND_URL}/app/invitations/${invitationId}" style="display: inline-block; padding: 16px 48px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; letter-spacing: 0.5px;">
                          REVIEW INVITATION
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 32px 40px; background-color: #f7fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 8px; font-size: 13px; line-height: 1.6; color: #718096; text-align: center;">
                    If you weren't expecting this invitation, you can decline it from your dashboard or contact the organization administrator.
                  </p>
                  <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #a0aec0; text-align: center;">
                    © ${new Date().getFullYear()} ${EnvironmentVariables.PRODUCT_NAME}. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
