import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || !user.nasabah) {
      return NextResponse.json(
        { message: "User not found or not a nasabah" },
        { status: 404 }
      );
    }

    const withdrawals = await db.withdrawalRequest.findMany({
      where: { nasabahId: user.nasabah.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      console.log("Withdrawals API: No token provided.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);

    console.log("Withdrawals API - User retrieved from token:", JSON.stringify(user, null, 2));

    if (!user || !user.nasabah) {
      console.error("Withdrawals API: Validation failed. User is not a valid nasabah.");
      return NextResponse.json(
        { message: "User not found or not a nasabah" },
        { status: 404 }
      );
    }

    const { amount } = await req.json();
    const withdrawalAmount = parseFloat(amount);

    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      return NextResponse.json(
        { message: "Invalid withdrawal amount" },
        { status: 400 }
      );
    }

    const nasabah = await db.nasabah.findUnique({
      where: { userId: user.id },
    });

    if (!nasabah || nasabah.balance < withdrawalAmount) {
      return NextResponse.json(
        { message: "Insufficient balance" },
        { status: 400 }
      );
    }

    const withdrawalRequest = await db.withdrawalRequest.create({
      data: {
        amount: withdrawalAmount,
        status: "PENDING",
        nasabah: {
          connect: { id: nasabah.id },
        },
      },
    });

    return NextResponse.json({
      message: "Withdrawal request submitted successfully",
      data: withdrawalRequest,
    });
  } catch (error) {
    console.error("Withdrawal request error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
