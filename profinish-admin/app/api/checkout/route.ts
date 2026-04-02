import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, amount } = body;

    if (!leadId || !amount) {
      return NextResponse.json({ error: "Missing leadId or amount" }, { status: 400 });
    }

    // Get the Stripe key at request-time to avoid any build cache issues
    // We also use .trim() and .replace() to safely remove any accidental spaces or quotation marks!
    const stripeKey = (process.env.STRIPE_SECRET_KEY || "").trim().replace(/^["']|["']$/g, "");
    if (!stripeKey || !stripeKey.startsWith("sk_")) {
      console.error("❌ Invalid Stripe Key Detected:", stripeKey);
      return NextResponse.json({ error: "Invalid or missing Stripe Secret Key. Must start with sk_" }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2026-02-25.clover',
    });

    // Stripe expects amounts in cents ($100.00 = 10000)
    const amountInCents = Math.round(amount * 100);

    // Dynamically get the base URL so it works flawlessly on Vercel and Localhost
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Profinish B2B Service Commission',
              description: `Commission for Job ID: ${leadId.split('-')[0].toUpperCase()}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/protected/lead/${leadId}?payment=success`,
      cancel_url: `${baseUrl}/protected/lead/${leadId}?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}