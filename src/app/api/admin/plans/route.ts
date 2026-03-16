import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Plan } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const plans = await Plan.find({}).sort({ price: 1 });
        return NextResponse.json(plans);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        await dbConnect();
        const plan = await Plan.create(body);
        return NextResponse.json(plan);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
    }
}
