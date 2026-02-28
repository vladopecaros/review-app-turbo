import { mailer } from '../../config/mailer';
import { EnvironmentVariables } from '../../helpers/env/environmentVariables';
import { systemRoutes } from '../../helpers/system.routes';
import { emailVerificationTemplate } from './templates/emailVerification.template';
import { organizationInviteTemplate } from './templates/organizationInvite.template';

export class EmailService {
  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${EnvironmentVariables.FRONTEND_URL}/${systemRoutes.emailVerification}?token=${token}`;

    await mailer.sendMail({
      to: email,
      from: `${EnvironmentVariables.PRODUCT_NAME} <no-reply@yourapp.com>`,
      subject: `Verify your email`,
      html: emailVerificationTemplate(verificationUrl),
    });
  }

  async sendOrganizationInvite(
    organizationName: string,
    role: 'owner' | 'member' | 'admin',
    email: string,
  ) {
    await mailer.sendMail({
      to: email,
      from: `${EnvironmentVariables.PRODUCT_NAME} <no-reply@yourapp.com>`,
      subject: `You're invited to an organization`,
      html: organizationInviteTemplate(organizationName, role),
    });
  }
}
