import { EnvironmentVariables } from '../../../helpers/env/environmentVariables';

export const emailVerificationTemplate = (verificationUrl: string) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
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
                    Welcome to ${EnvironmentVariables.PRODUCT_NAME}!
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1a202c; line-height: 1.4;">
                    We're excited to have you join us
                  </h2>

                  <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                    To ensure the security of your account and complete your registration, we need to verify your email address. This helps us keep your account safe and ensure you receive important updates.
                  </p>

                  <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                    Click the button below to verify your email and activate your account:
                  </p>

                  <!-- Button -->
                  <table role="presentation" style="margin: 0 auto; border-collapse: collapse;">
                    <tr>
                      <td style="border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                        <a href="${verificationUrl}" style="display: inline-block; padding: 16px 48px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; letter-spacing: 0.5px;">
                          VERIFY EMAIL
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 32px 0 0; font-size: 14px; line-height: 1.6; color: #718096;">
                    If the button doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="margin: 8px 0 0; font-size: 13px; line-height: 1.6; color: #667eea; word-break: break-all;">
                    ${verificationUrl}
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 32px 40px; background-color: #f7fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 8px; font-size: 13px; line-height: 1.6; color: #718096; text-align: center;">
                    If you didn't create an account with ${EnvironmentVariables.PRODUCT_NAME}, you can safely ignore this email.
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
