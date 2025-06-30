// app/api/send-abandonment-email/route.js
import { NextResponse } from 'next/server';
import { sendAbandonmentEmail } from '@/utils/brevoAbandonmentEmail';

export async function POST(request) {
  try {
    const { email, type, cartItems, sessionDuration, timestamp } = await request.json();
    
    console.log(`📧 Abandonment email request: ${type} for ${email}`);
    
    // Validate required data
    if (!email || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    // Validate abandonment type
    if (!['cart_abandonment', 'website_abandonment'].includes(type)) {
      return NextResponse.json({ error: 'Invalid abandonment type' }, { status: 400 });
    }
    
    // Prepare abandonment data for Brevo utility
    const abandonmentData = {
      email,
      type,
      cartItems: cartItems || [],
      sessionDuration: sessionDuration || 0,
      timestamp: timestamp || new Date().toISOString()
    };
    
    // Send email using Brevo utility
    const result = await sendAbandonmentEmail(abandonmentData);
    
    // Log for debugging
    console.log(`✅ ${type} email sent successfully to ${email}`);
    console.log('📧 Brevo result:', result);
    
    return NextResponse.json({
      success: true,
      message: `${type} email sent successfully`,
      emailType: type,
      recipient: email,
      templateId: result.templateId,
      messageId: result.messageId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error sending abandonment email:', error);
    
    // Return different error messages based on error type
    let errorMessage = 'Failed to send email';
    let statusCode = 500;
    
    if (error.message.includes('BREVO_API_KEY')) {
      errorMessage = 'Email service configuration error';
      statusCode = 500;
    } else if (error.message.includes('Brevo API Error')) {
      errorMessage = 'Email service error';
      statusCode = 502;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error.message,
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: statusCode });
  }
}