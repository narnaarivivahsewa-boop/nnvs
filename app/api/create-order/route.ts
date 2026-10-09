import { NextRequest, NextResponse } from "next/server";
import { getRazorpayClient, getRazorpayCredentials } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body provided." },
        { status: 400 }
      );
    }

    const { amount, currency = "INR", receipt, notes = {} } = body;

    // Minimum amount check: Razorpay requires minimum 100 paise (₹1.00)
    const amountNum = Number(amount);
    if (!amountNum || isNaN(amountNum) || amountNum < 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid amount. Minimum amount must be at least 100 paise (₹1.00).",
        },
        { status: 400 }
      );
    }

    let credentials;
    try {
      credentials = getRazorpayCredentials();
    } catch (authError: any) {
      return NextResponse.json(
        {
          success: false,
          message: authError?.message || "Razorpay credentials unauthorized.",
        },
        { status: 401 }
      );
    }

    const razorpay = getRazorpayClient();

    const orderOptions = {
      amount: Math.round(amountNum), // amount in paise
      currency: String(currency).toUpperCase(),
      receipt: receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        ...notes,
        source: "RishteClub Matrimony Standard Checkout",
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    return NextResponse.json(
      {
        success: true,
        order_id: order.id,
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        key_id: credentials.keyId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("RAZORPAY ORDER CREATION ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || error?.error?.description || "Failed to create Razorpay order.",
        error: error?.error || undefined,
      },
      { status: error?.statusCode || 500 }
    );
  }
}
