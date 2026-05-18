import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { calculateStreak } from "../../../lib/streak";
import { uploadToCloudinary } from "../../../lib/cloudinary";

// GET /api/user/rosary-log - Retrieve user's daily status and current streak
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get("timezone") || "America/Sao_Paulo";

    // Fetch all user's rosary logs
    const logs = await prisma.rosaryLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const { currentStreak, hasLoggedToday } = calculateStreak(logs, timezone);
    const todayLog = hasLoggedToday ? logs[0] : null;

    // Map all logs to local YYYY-MM-DD strings to help the calendar render completed days
    const loggedDates = logs.map((log) => {
      try {
        return new Date(log.createdAt).toLocaleDateString("sv-SE", { timeZone: timezone });
      } catch (e) {
        // Fallback if timezone is invalid
        return new Date(log.createdAt).toISOString().split("T")[0];
      }
    });

    return NextResponse.json({
      currentStreak,
      hasLoggedToday,
      todayPhotoUrl: todayLog ? todayLog.photoUrl : null,
      loggedDates,
    });
  } catch (error) {
    console.error("Error in GET /api/user/rosary-log:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}

// POST /api/user/rosary-log - Log a new daily rosary by uploading a photo
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const timezone = formData.get("timezone") as string || "America/Sao_Paulo";

    if (!file) {
      return NextResponse.json({ error: "Nenhuma foto foi enviada." }, { status: 400 });
    }

    // 1. Verify if user already logged a rosary today to prevent double posting
    const allLogs = await prisma.rosaryLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const { hasLoggedToday } = calculateStreak(allLogs, timezone);
    if (hasLoggedToday) {
      return NextResponse.json({ error: "Você já registrou seu terço hoje." }, { status: 400 });
    }

    // 2. Read file data buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Upload directly to Cloudinary
    let publicPhotoUrl: string;
    try {
      publicPhotoUrl = await uploadToCloudinary(buffer, "holy-streaks/rosaries");
    } catch (uploadError: any) {
      console.error("Cloudinary upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message || "Falha ao enviar foto do terço para o Cloudinary." },
        { status: 400 }
      );
    }

    // 4. Create new RosaryLog entry in DB
    const newLog = await prisma.rosaryLog.create({
      data: {
        userId: user.id,
        photoUrl: publicPhotoUrl,
      },
    });

    // 5. Recalculate streak
    const updatedLogs = [newLog, ...allLogs];
    const { currentStreak } = calculateStreak(updatedLogs, timezone);

    return NextResponse.json({
      success: true,
      currentStreak,
      photoUrl: publicPhotoUrl,
    });
  } catch (error) {
    console.error("Error in POST /api/user/rosary-log:", error);
    return NextResponse.json({ error: "Erro interno no servidor ao salvar log do terço." }, { status: 500 });
  }
}
