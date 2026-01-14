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
        const { order_id } = await req.json()

        if (!order_id) {
            return new Response(
                JSON.stringify({ success: false, error: 'Missing order_id' }),
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

        // Fetch payments for the order from Razorpay
        const razorpay = new RazorpayClient(keyId, keySecret)
        const paymentsResponse = await razorpay.fetchOrderPayments(order_id)

        // Determine verification status
        // A payment is genuine if status === 'captured' && captured === true
        const genuinePayment = paymentsResponse.items.find(
            payment => payment.status === 'captured' && payment.captured === true
        )

        const hasFailedPayments = paymentsResponse.items.some(
            payment => payment.status === 'failed'
        )

        let verification_status: 'genuine' | 'failed' | 'no_payments' | 'pending'
        if (genuinePayment) {
            verification_status = 'genuine'
        } else if (hasFailedPayments && paymentsResponse.items.every(p => p.status === 'failed')) {
            verification_status = 'failed'
        } else if (paymentsResponse.count === 0) {
            verification_status = 'no_payments'
        } else {
            verification_status = 'pending'
        }

        return new Response(
            JSON.stringify({
                success: true,
                order_id,
                verification_status,
                payment_count: paymentsResponse.count,
                genuine_payment: genuinePayment ? {
                    id: genuinePayment.id,
                    amount: genuinePayment.amount,
                    status: genuinePayment.status,
                    captured: genuinePayment.captured,
                    method: genuinePayment.method,
                } : null,
                payments: paymentsResponse.items.map(p => ({
                    id: p.id,
                    amount: p.amount,
                    status: p.status,
                    captured: p.captured,
                    method: p.method,
                    error_code: p.error_code,
                    error_description: p.error_description,
                    created_at: p.created_at,
                })),
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Fetch order payments error:', error.message || 'Unknown error')
        return new Response(
            JSON.stringify({ success: false, error: error.message || 'Failed to fetch payments' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
