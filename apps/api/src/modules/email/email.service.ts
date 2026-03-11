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
      from: EnvironmentVariables.SMTP_FROM,
      subject: `Verify your email`,
      html: emailVerificationTemplate(verificationUrl),
    });
  }

  async sendOrganizationInvite(
    organizationName: string,
    role: 'owner' | 'member' | 'admin',
    email: string,
    invitationId: string,
  ) {
    await mailer.sendMail({
      to: email,
      from: EnvironmentVariables.SMTP_FROM,
      subject: `You're invited to an organization`,
      html: organizationInviteTemplate(organizationName, role, invitationId),
    });
  }
}
