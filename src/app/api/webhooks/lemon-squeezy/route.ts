import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { addCredits } from '@/lib/services/credits';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-signature');
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

    if (!secret) {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const digest = hmac.digest('hex');

    if (signature !== digest) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const eventName = payload.meta?.event_name;

    if (eventName === 'order_created' || eventName === 'order_completed') {
      const orderData = payload.data;
      const customData = orderData?.attributes?.custom_data;
      const userId = customData?.user_id;

      if (!userId) {
        return NextResponse.json({ error: 'No user_id in custom_data' }, { status: 400 });
      }

      const variantId = orderData?.attributes?.first_order_item?.variant_id;
      const creditsMap: Record<string, number> = {
        [process.env.LEMON_SQUEEZY_VARIANT_ID_CREDITS || '']: 100,
      };
      const credits = creditsMap[variantId || ''] ?? 50;

      const admin = createAdminClient();
      await admin.from('orders').upsert({
        lemon_squeezy_order_id: orderData?.id,
        user_id: userId,
        lemon_squeezy_variant_id: variantId,
        status: 'completed',
        credits_granted: credits,
        amount_cents: orderData?.attributes?.total,
        metadata: payload,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'lemon_squeezy_order_id' });

      await addCredits(userId, credits, 'purchase', {
        id: orderData?.id,
        type: 'order',
      });
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('Lemon Squeezy webhook error:', e);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
