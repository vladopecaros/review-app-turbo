import { EnvironmentVariables } from '../helpers/env/environmentVariables';

import nodemailer from 'nodemailer';

export const mailer = nodemailer.createTransport({
  host: EnvironmentVariables.SMTP_HOST,
  port: Number(EnvironmentVariables.SMTP_PORT),
  secure: EnvironmentVariables.SMTP_SECURE === 'true',
  auth: {
    user: EnvironmentVariables.SMTP_USER,
    pass: EnvironmentVariables.SMTP_PASS,
  },
});
