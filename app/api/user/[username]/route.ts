import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { calculateStreak } from "../../../lib/streak";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const visitor = await getCurrentUser();
    if (!visitor) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { username } = await params;
    const targetUsername = username.toLowerCase().trim();

    // 1. Fetch target user and their rosary logs
    const targetUser = await prisma.user.findUnique({
      where: { username: targetUsername },
      include: {
        rosaryLogs: {
          select: {
            id: true,
            photoUrl: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Guerreiro não encontrado." }, { status: 404 });
    }

    // 2. Parse timezone
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get("timezone") || "America/Sao_Paulo";

    // 3. Calculate streak dynamically
    const { currentStreak, hasLoggedToday } = calculateStreak(
      targetUser.rosaryLogs,
      timezone
    );

    // 4. Find today's log in target timezone
    const todayLog = targetUser.rosaryLogs.find((log) => {
      const logDateStr = new Date(log.createdAt).toLocaleDateString("en-US", { timeZone: timezone });
      const todayDateStr = new Date().toLocaleDateString("en-US", { timeZone: timezone });
      return logDateStr === todayDateStr;
    });

    // 5. Apply privacy rules
    const isSelf = visitor.id === targetUser.id;
    const canShowPhoto = isSelf || targetUser.showPrayerPhotos;
    const todayPhotoUrl = todayLog ? (canShowPhoto ? todayLog.photoUrl : "private") : null;

    // 6. Calculate all completed prayer dates (YYYY-MM-DD) in user's timezone
    const completedDates = Array.from(
      new Set(
        targetUser.rosaryLogs.map((log) => {
          try {
            return new Intl.DateTimeFormat("en-CA", {
              timeZone: timezone,
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date(log.createdAt));
          } catch (e) {
            return new Intl.DateTimeFormat("en-CA", {
              timeZone: "America/Sao_Paulo",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date(log.createdAt));
          }
        })
      )
    );

    // Oldest log is the last element because we ordered desc
    const oldestLog = targetUser.rosaryLogs[targetUser.rosaryLogs.length - 1];
    let firstRecordDate: string | null = null;
    if (oldestLog) {
      try {
        firstRecordDate = new Intl.DateTimeFormat("en-CA", {
          timeZone: timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(oldestLog.createdAt));
      } catch (e) {
        firstRecordDate = new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Sao_Paulo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(oldestLog.createdAt));
      }
    }

    return NextResponse.json({
      profile: {
        id: targetUser.id,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        username: targetUser.username,
        profilePhotoUrl: targetUser.profilePhotoUrl,
        showPrayerPhotos: targetUser.showPrayerPhotos,
        streak: currentStreak,
        hasLoggedToday,
        todayPhotoUrl,
        isSelf,
        completedDates,
        firstRecordDate,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/user/[username]:", error);
    return NextResponse.json({ error: "Erro interno no servidor ao obter perfil." }, { status: 500 });
  }
}
