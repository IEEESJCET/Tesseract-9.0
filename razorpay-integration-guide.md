---
description: Integrate Razorpay payment gateway with secure server-side order creation and signature verification
---

# Razorpay Payment Gateway Integration

This workflow implements a production-ready Razorpay integration following security best practices.

## Prerequisites

- Razorpay account with API keys (Test or Live)
- Supabase project with Edge Functions enabled
- React frontend (Vite recommended)

---

## Step 1: Set Up Environment Variables

### Frontend (.env)
```env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Secrets (via CLI or Dashboard)
```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
supabase secrets set RAZORPAY_KEY_SECRET=your-secret-key
```

> ⚠️ NEVER expose RAZORPAY_KEY_SECRET to the frontend

---

## Step 2: Create Database Schema

Create a `payments` table in Supabase:

```sql
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Foreign key to your entity (customize this)
    user_id UUID REFERENCES auth.users(id),
    -- Razorpay fields
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT UNIQUE,
    amount INTEGER NOT NULL, -- Store in rupees or paise (be consistent)
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_payments_payment_id ON payments(razorpay_payment_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);

-- RLS policies (customize based on your needs)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
    ON payments FOR SELECT
    USING (auth.uid() = user_id);
```

---

## Step 3: Create Shared Razorpay Module

Create `supabase/functions/_shared/razorpay.ts`:

```typescript
const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1'

interface RazorpayOrder {
    id: string
    amount: number
    currency: string
    receipt: string
    status: string
}

export class RazorpayClient {
    private authHeader: string

    constructor(keyId: string, keySecret: string) {
        this.authHeader = 'Basic ' + btoa(`${keyId}:${keySecret}`)
    }

    async createOrder(
        amount: number,
        currency: string,
        receipt: string,
        notes?: Record<string, string>
    ): Promise<RazorpayOrder> {
        const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: this.authHeader,
            },
            body: JSON.stringify({ amount, currency, receipt, notes }),
        })

        const data = await response.json()

        if (!response.ok || data.error) {
            throw new Error(data.error?.description || 'Failed to create order')
        }

        return data as RazorpayOrder
    }

    async fetchOrder(orderId: string): Promise<RazorpayOrder> {
        const response = await fetch(`${RAZORPAY_API_BASE}/orders/${orderId}`, {
            headers: { Authorization: this.authHeader },
        })

        const data = await response.json()

        if (!response.ok || data.error) {
            throw new Error(data.error?.description || 'Failed to fetch order')
        }

        return data as RazorpayOrder
    }
}

// Async signature verification using Web Crypto API (HMAC-SHA256)
export async function verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
    keySecret: string
): Promise<boolean> {
    const body = `${orderId}|${paymentId}`

    const encoder = new TextEncoder()
    const keyData = encoder.encode(keySecret)
    const messageData = encoder.encode(body)

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData)

    const hashArray = Array.from(new Uint8Array(signatureBuffer))
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    return expectedSignature === signature
}
```

---

## Step 4: Create Order Edge Function

Create `supabase/functions/create-order/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { RazorpayClient } from '../_shared/razorpay.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request): Promise<Response> => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ success: false, error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    try {
        const { amount, user_id, metadata } = await req.json()

        if (!amount || !user_id) {
            return new Response(
                JSON.stringify({ success: false, error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const keyId = Deno.env.get('RAZORPAY_KEY_ID')
        const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

        if (!keyId || !keySecret) {
            console.error('Missing Razorpay credentials')
            return new Response(
                JSON.stringify({ success: false, error: 'Payment service not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const razorpay = new RazorpayClient(keyId, keySecret)

        const amountInPaise = Math.round(amount * 100)
        const receipt = `order_${user_id.slice(0, 8)}_${Date.now()}`

        const order = await razorpay.createOrder(amountInPaise, 'INR', receipt, metadata)

        console.log(`Order created: ${order.id}`)

        return new Response(
            JSON.stringify({
                success: true,
                order_id: order.id,
                amount: order.amount,
                currency: order.currency,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Create order error:', error.message || 'Unknown error')
        return new Response(
            JSON.stringify({ success: false, error: 'Failed to create order' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
```

---

## Step 5: Create Verify Payment Edge Function

Create `supabase/functions/verify-payment/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyPaymentSignature } from '../_shared/razorpay.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ success: false, error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            user_id,
            amount
        } = await req.json()

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !user_id) {
            return new Response(
                JSON.stringify({ success: false, error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
        if (!keySecret) {
            console.error('Missing Razorpay key secret')
            return new Response(
                JSON.stringify({ success: false, error: 'Payment service not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Verify signature (CRITICAL SECURITY CHECK)
        const isValidSignature = await verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            keySecret
        )

        if (!isValidSignature) {
            console.error(`Invalid signature for payment ${razorpay_payment_id}`)
            return new Response(
                JSON.stringify({ success: false, error: 'Invalid payment signature' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`Payment signature verified: ${razorpay_payment_id}`)

        // Initialize Supabase with service role
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Supabase credentials')
            return new Response(
                JSON.stringify({ success: false, error: 'Database service not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Idempotency check
        const { data: existingPayment } = await supabase
            .from('payments')
            .select('id')
            .eq('razorpay_payment_id', razorpay_payment_id)
            .maybeSingle()

        if (existingPayment) {
            console.log(`Payment ${razorpay_payment_id} already recorded`)
            return new Response(
                JSON.stringify({ success: true, message: 'Payment already recorded' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Insert payment record
        const { error: paymentError } = await supabase.from('payments').insert({
            user_id,
            razorpay_order_id,
            razorpay_payment_id,
            amount,
            status: 'completed',
        })

        if (paymentError) {
            console.error('Failed to insert payment:', paymentError.message || 'Unknown error')
            throw new Error('Failed to record payment')
        }

        console.log(`Payment ${razorpay_payment_id} recorded for user ${user_id}`)

        return new Response(
            JSON.stringify({ success: true, message: 'Payment verified and recorded' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Verify payment error:', error.message || 'Unknown error')
        return new Response(
            JSON.stringify({ success: false, error: 'Payment verification failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
```

---

## Step 6: Create Frontend Payment Component

Create a React component (e.g., `src/components/PaymentButton.jsx`):

```jsx
import { useState } from 'react'

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function PaymentButton({ amount, userId, onSuccess, onError }) {
    const [loading, setLoading] = useState(false)

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script')
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.onload = () => resolve(true)
            script.onerror = () => resolve(false)
            document.body.appendChild(script)
        })
    }

    const handlePayment = async () => {
        setLoading(true)

        try {
            // Load Razorpay SDK
            const loaded = await loadRazorpay()
            if (!loaded) throw new Error('Failed to load payment gateway')

            // Step 1: Create order on server
            const orderRes = await fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({ amount, user_id: userId }),
            })

            const orderData = await orderRes.json()
            if (!orderData.success) throw new Error(orderData.error)

            // Step 2: Open Razorpay checkout
            const options = {
                key: RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                order_id: orderData.order_id,
                name: 'Your App Name',
                description: 'Payment Description',
                handler: async (response) => {
                    try {
                        // Step 3: Verify payment on server
                        const verifyRes = await fetch(`${SUPABASE_URL}/functions/v1/verify-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            },
                            body: JSON.stringify({
                                razorpay_order_id: orderData.order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                user_id: userId,
                                amount,
                            }),
                        })

                        const verifyData = await verifyRes.json()
                        if (!verifyData.success) throw new Error(verifyData.error)

                        onSuccess?.(response.razorpay_payment_id)
                    } catch (error) {
                        onError?.(error.message)
                    } finally {
                        setLoading(false)
                    }
                },
                theme: { color: '#1c1917' },
                modal: {
                    ondismiss: () => setLoading(false),
                },
            }

            const razorpay = new window.Razorpay(options)
            razorpay.on('payment.failed', (response) => {
                onError?.(response.error.description)
                setLoading(false)
            })
            razorpay.open()

        } catch (error) {
            onError?.(error.message)
            setLoading(false)
        }
    }

    return (
        <button onClick={handlePayment} disabled={loading}>
            {loading ? 'Processing...' : `Pay ₹${amount}`}
        </button>
    )
}
```

---

## Step 7: Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy create-order
supabase functions deploy verify-payment
```

---

## Security Checklist

- [ ] RAZORPAY_KEY_SECRET is only in server environment
- [ ] Signature verification uses HMAC-SHA256
- [ ] Idempotency check prevents duplicate payments
- [ ] Error messages don't expose sensitive details
- [ ] No sensitive data (signature, secret) in logs
- [ ] CORS headers configured for your domain in production

---

## Optional Enhancements

1. **Webhook Backup**: Add `payment.captured` webhook for reliability
2. **Amount Verification**: Fetch order from Razorpay API to verify amount
3. **Rate Limiting**: Prevent abuse of payment endpoints
4. **Refund Support**: Add refund edge function using Razorpay Refunds API

---

## Reference Implementation

See the Buildathon project for a working example:
- `supabase/functions/create-order/index.ts`
- `supabase/functions/verify-payment/index.ts`
- `supabase/functions/_shared/razorpay.ts`
- `src/pages/Payment.jsx`
