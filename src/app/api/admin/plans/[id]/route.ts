import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Plan } from "@/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        await dbConnect();
        const plan = await Plan.findByIdAndUpdate(id, body, { new: true });
        if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        
        return NextResponse.json(plan);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const plan = await Plan.findByIdAndDelete(id);
        if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 });
    }
}
