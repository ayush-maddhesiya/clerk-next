// pages/api/clerk-webhook.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import sendgrid from '@sendgrid/mail';

// Set SendGrid API key from environment variables
sendgrid.setApiKey("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");

// Disable Next.js default body parsing for raw webhook payloads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Define a type for Clerk's user object (customize based on Clerk's response)
interface ClerkUser {
  id: string;
  email_addresses: { email_address: string }[];
  first_name?: string;
}

// Define a type for the webhook event structure (customize based on Clerk's webhook payload)
interface ClerkEvent {
  type: string;
  data: ClerkUser;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      // Parse raw body to verify event
      const rawBody = await buffer(req);
      const event: ClerkEvent = JSON.parse(rawBody.toString());

      // Handle 'user.created' event type
      if (event.type === 'user.created') {
        const user = event.data;

        // Send a welcome email via SendGrid
        await sendgrid.send({
          to: user.email_addresses[0].email_address, // Recipient email
          from: 'team@hiredeasy.com', // Verified sender email in SendGrid
          // template_id: 'd-fb47d44c999a45ec8d675b2881408766', // Email template ID from SendGrid
          subject: 'Welcome to Our Platform!',
          text: `Hello ${user.first_name || ''}, welcome to our platform!`,
          html: `<strong>Hello ${user.first_name || ''}, welcome to our platform!</strong>`,
        });

        return res.status(200).json({ message: 'Welcome email sent successfully' });
      }

      // Respond with 204 if the event type isn't handled
      return res.status(204).json({});
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({ error: 'Failed to handle webhook' });
    }
  } else {
    // Handle unsupported methods
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}
