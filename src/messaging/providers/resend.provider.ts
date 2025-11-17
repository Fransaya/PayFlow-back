import resend from 'resend';

export const resendClient = new resend.Resend(process.env.RESEND_API_KEY);

export const ResendProvider = {
  provide: 'RESEND_CLIENT',
  useValue: resendClient,
};
