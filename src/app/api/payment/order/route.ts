import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        console.error("Razorpay keys are missing");
        return NextResponse.json({ error: "Razorpay configuration error" }, { status: 500 });
    }

    const razorpay = new Razorpay({
        key_id,
        key_secret,
    });

    const { amount, planId } = await req.json().catch(() => ({ amount: 100, planId: null }));

    let finalAmount = amount || 100;

    if (planId) {
        await dbConnect();
        const { Plan } = await import("@/models");
        const plan = await Plan.findById(planId);
        if (plan) {
            finalAmount = plan.price;
        }
    }

    const options = {
        amount: finalAmount * 100, // Rs to paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
    };

    try {
        const order = await razorpay.orders.create(options);
        return NextResponse.json(order);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
    }
}

import dbConnect from "@/lib/db";
