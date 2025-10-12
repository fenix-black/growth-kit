import { sendEmail } from '@/lib/email';
import { format } from 'date-fns';

export async function sendBookingConfirmation(
  attendeeEmail: string,
  attendeeName: string,
  meetingType: string,
  startTime: Date,
  endTime: Date,
  appName: string
): Promise<boolean> {
  const formattedDate = format(startTime, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(startTime, 'h:mm a');
  const formattedEndTime = format(endTime, 'h:mm a');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .meeting-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
    .label { font-weight: 600; color: #6b7280; }
    .value { color: #1f2937; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">Meeting Confirmed ✓</h1>
    </div>
    <div class="content">
      <p>Hi ${attendeeName},</p>
      <p>Your ${meetingType.toLowerCase()} with ${appName} has been confirmed!</p>
      
      <div class="meeting-details">
        <div class="detail-row">
          <span class="label">Meeting Type:</span>
          <span class="value">${meetingType}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date:</span>
          <span class="value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="label">Time:</span>
          <span class="value">${formattedTime} - ${formattedEndTime}</span>
        </div>
      </div>

      <p>We're looking forward to speaking with you!</p>
      <p>If you need to reschedule or have any questions, please reply to this email.</p>

      <div class="footer">
        <p>Powered by GrowthKit</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Meeting Confirmed

Hi ${attendeeName},

Your ${meetingType.toLowerCase()} with ${appName} has been confirmed!

Meeting Details:
- Type: ${meetingType}
- Date: ${formattedDate}
- Time: ${formattedTime} - ${formattedEndTime}

We're looking forward to speaking with you!

If you need to reschedule or have any questions, please reply to this email.

---
Powered by GrowthKit
  `;

  const result = await sendEmail({
    to: attendeeEmail,
    subject: `${meetingType} Confirmed - ${formattedDate} at ${formattedTime}`,
    html,
    text,
    from: `${appName} <noreply@waitlist.fenixblack.ai>`
  });

  return result.success;
}

