import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    
    const success = await sendTelegramMessage(message);

    if (!success) {
      // If it failed, it might be due to missing config or API error, 
      // but sendTelegramMessage logs it.
      // We'll return 500 if it failed, assuming config is present but failed.
      // If config is missing, sendTelegramMessage returns false but logs warning.
      // Let's check env vars here to be specific if needed, or just return generic error.
      if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
         return NextResponse.json({ success: false, error: 'Telegram credentials not configured on server' }, { status: 500 });
      }
      throw new Error('Failed to send Telegram message');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Telegram Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to send notification' 
    }, { status: 500 });
  }
}
