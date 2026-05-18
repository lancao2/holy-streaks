import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    // Fetch all pending group memberships for this user
    const pendingMemberships = await prisma.groupMember.findMany({
      where: {
        userId: user.id,
        status: "PENDING",
      },
      include: {
        group: {
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    const invitations = pendingMemberships.map((membership) => ({
      id: membership.id,
      groupId: membership.groupId,
      joinedAt: membership.joinedAt,
      group: {
        id: membership.group.id,
        name: membership.group.name,
        description: membership.group.description,
        endDate: membership.group.endDate,
        creator: membership.group.creator,
      },
    }));

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Error in GET /api/groups/invitations:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
