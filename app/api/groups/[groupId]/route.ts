import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { calculateStreak } from "../../../lib/streak";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get("timezone") || "America/Sao_Paulo";
    const { groupId } = await params;

    // Verify that the user is an accepted member of this group (or is the creator)
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!membership || (membership.status !== "ACCEPTED" && membership.role !== "CREATOR")) {
      return NextResponse.json({ error: "Você não tem permissão para acessar este grupo." }, { status: 403 });
    }

    // Fetch the group details along with all members and their rosary logs
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            profilePhotoUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                email: true,
                profilePhotoUrl: true,
                rosaryLogs: {
                  select: {
                    id: true,
                    photoUrl: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
          orderBy: {
            joinedAt: "asc",
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 });
    }

    // Get formatted end date string in target timezone if scheduled
    let endDateDateStr: string | null = null;
    if (group.endDate) {
      try {
        endDateDateStr = new Date(group.endDate).toLocaleDateString("en-CA", { timeZone: timezone });
      } catch (e) {
        endDateDateStr = new Date(group.endDate).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
      }
    }

    // Filter out "REQUESTED" members if the current user is NOT the creator
    const allowedMembers = membership.role === "CREATOR"
      ? group.members
      : group.members.filter(m => m.status !== "REQUESTED");

    // Map members to calculate their streaks dynamically
    const mappedMembers = allowedMembers.map((member) => {
      // Filter rosaryLogs to only include logs on or after member.joinedAt and on or before group.endDate
      const filteredLogs = member.user.rosaryLogs.filter((log) => {
        try {
          const logDateStr = new Date(log.createdAt).toLocaleDateString("en-CA", { timeZone: timezone });
          const joinedDateStr = new Date(member.joinedAt).toLocaleDateString("en-CA", { timeZone: timezone });
          let isWithinRange = logDateStr >= joinedDateStr;
          if (isWithinRange && endDateDateStr) {
            isWithinRange = logDateStr <= endDateDateStr;
          }
          return isWithinRange;
        } catch (e) {
          const logDateStr = new Date(log.createdAt).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
          const joinedDateStr = new Date(member.joinedAt).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
          let isWithinRange = logDateStr >= joinedDateStr;
          if (isWithinRange && endDateDateStr) {
            isWithinRange = logDateStr <= endDateDateStr;
          }
          return isWithinRange;
        }
      });

      const { currentStreak, hasLoggedToday } = calculateStreak(
        filteredLogs,
        timezone
      );

      // Find today's log in target timezone
      const todayLog = filteredLogs.find((log) => {
        const logDateStr = new Date(log.createdAt).toLocaleDateString("en-US", { timeZone: timezone });
        const todayDateStr = new Date().toLocaleDateString("en-US", { timeZone: timezone });
        return logDateStr === todayDateStr;
      });

      // Remove rosaryLogs payload from the JSON to keep it lightweight
      const { rosaryLogs, ...userWithoutLogs } = member.user as any;

      return {
        id: member.id,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
        user: userWithoutLogs,
        streak: currentStreak,
        hasLoggedToday,
        todayPhotoUrl: todayLog ? todayLog.photoUrl : null,
        todayLoggedAt: todayLog ? todayLog.createdAt.toISOString() : null,
      };
    });

    const responseGroup = {
      id: group.id,
      name: group.name,
      description: group.description,
      endDate: group.endDate,
      allowMemberInvites: group.allowMemberInvites,
      createdAt: group.createdAt,
      creator: group.creator,
      members: mappedMembers,
    };

    return NextResponse.json({ group: responseGroup });
  } catch (error) {
    console.error("Error in GET /api/groups/[groupId]:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}

// DELETE /api/groups/[groupId] - Leave a challenge group, delete group if no active members remain
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { groupId } = await params;

    // Verify membership
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Você não faz parte deste desafio." }, { status: 404 });
    }

    // Delete membership and handle cascade-deletion if last member in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.groupMember.delete({
        where: {
          id: membership.id,
        },
      });

      // Count active (ACCEPTED) remaining members
      const activeMembersCount = await tx.groupMember.count({
        where: {
          groupId,
          status: "ACCEPTED",
        },
      });

      // If no active members remain, delete the entire challenge group
      if (activeMembersCount === 0) {
        await tx.group.delete({
          where: {
            id: groupId,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/groups/[groupId]:", error);
    return NextResponse.json({ error: "Erro interno no servidor ao abandonar o desafio." }, { status: 500 });
  }
}

// PATCH /api/groups/[groupId] - Update challenge group settings (Only Creator)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { groupId } = await params;

    // 1. Verify that the caller is the CREATOR (Leader) of this group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!membership || membership.role !== "CREATOR") {
      return NextResponse.json(
        { error: "Apenas o líder do desafio pode alterar as configurações." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { allowMemberInvites } = body;

    if (allowMemberInvites === undefined || typeof allowMemberInvites !== "boolean") {
      return NextResponse.json(
        { error: "Configuração 'allowMemberInvites' inválida." },
        { status: 400 }
      );
    }

    // 2. Update the group
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        allowMemberInvites,
      },
    });

    return NextResponse.json({ success: true, group: updatedGroup });
  } catch (error) {
    console.error("Error in PATCH /api/groups/[groupId]:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao atualizar configurações." },
      { status: 500 }
    );
  }
}
