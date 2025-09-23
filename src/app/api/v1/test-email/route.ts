import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { sendWaitlistConfirmationEmail } from '@/lib/email/send';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const hasApiKey = !!process.env.RESEND_API_KEY;
  
  const result = {
    hasResendApiKey: hasApiKey,
    emailFrom: process.env.EMAIL_FROM || 'Not set',
    nodeEnv: process.env.NODE_ENV,
    defaultFrom: 'noreply@waitlist.fenixblack.ai',
  };
  
  // Try to send a test email if query param is provided
  const searchParams = request.nextUrl.searchParams;
  const sendTest = searchParams.get('send') === 'true';
  const testType = searchParams.get('type') || 'simple'; // simple or waitlist
  const to = searchParams.get('to') || 'pablo@fenixblack.ai';
  const appId = searchParams.get('appId');
  
  if (sendTest && hasApiKey) {
    try {
      if (testType === 'waitlist' && appId) {
        // Test waitlist confirmation email
        const app = await prisma.app.findUnique({ where: { id: appId } });
        
        if (!app) {
          return NextResponse.json({
            ...result,
            error: 'App not found',
          });
        }
        
        console.log('Testing waitlist email for app:', app.name);
        
        const emailResult = await sendWaitlistConfirmationEmail(
          app,
          to,
          {
            position: 42,
            estimatedWait: '2-3 days (test)',
          }
        );
        
        return NextResponse.json({
          ...result,
          waitlistTest: {
            success: emailResult.success,
            error: emailResult.error,
            data: emailResult.data,
            to,
            appName: app.name,
            appDomain: app.domain,
          }
        });
      } else {
        // Simple test email
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { data, error } = await resend.emails.send({
          from: 'GrowthKit <noreply@waitlist.fenixblack.ai>',
          to,
          subject: 'Test from deployed server',
          html: `<p>This email was sent from the deployed server at ${new Date().toISOString()}</p>`,
        });
        
        return NextResponse.json({
          ...result,
          emailTest: {
            success: !error,
            id: data?.id,
            error: error?.message,
            to,
          }
        });
      }
    } catch (e: any) {
      return NextResponse.json({
        ...result,
        error: e.message,
      });
    }
  }
  
  return NextResponse.json(result);
}
