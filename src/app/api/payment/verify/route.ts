import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import { User } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = await req.json();
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
        console.error("RAZORPAY_KEY_SECRET is missing");
        return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    await dbConnect();
    const { Plan } = await import("@/models");
    
    let durationDays = 7;
    if (planId) {
        const plan = await Plan.findById(planId);
        if (plan) {
            durationDays = plan.durationDays;
        }
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    if (razorpay_signature === "free_access") {
        await User.findOneAndUpdate(
            { email: (session as any).user.email },
            {
                subscriptionStatus: "active",
                planExpiry: expiryDate
            }
        );
        return NextResponse.json({ success: true });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", key_secret)
        .update(body.toString())
        .digest("hex");

    if (expectedSignature === razorpay_signature) {
        await User.findOneAndUpdate(
            { email: (session as any).user.email },
            {
                subscriptionStatus: "active",
                planExpiry: expiryDate
            }
        );
        return NextResponse.json({ success: true });
    } else {
        return NextResponse.json({ success: false, error: "Signature mismatch" }, { status: 400 });
    }
}
