const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1'

interface RazorpayOrder {
    id: string
    amount: number
    currency: string
    receipt: string
    status: string
}

export interface RazorpayPayment {
    id: string
    entity: string
    amount: number
    currency: string
    status: string
    order_id: string
    method: string
    captured: boolean
    description: string | null
    email: string
    contact: string
    fee: number | null
    tax: number | null
    error_code: string | null
    error_description: string | null
    error_source: string | null
    error_step: string | null
    error_reason: string | null
    created_at: number
}

export interface RazorpayPaymentsResponse {
    entity: string
    count: number
    items: RazorpayPayment[]
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

    async fetchOrderPayments(orderId: string): Promise<RazorpayPaymentsResponse> {
        const response = await fetch(`${RAZORPAY_API_BASE}/orders/${orderId}/payments`, {
            headers: { Authorization: this.authHeader },
        })

        const data = await response.json()

        if (!response.ok || data.error) {
            throw new Error(data.error?.description || 'Failed to fetch order payments')
        }

        return data as RazorpayPaymentsResponse
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
