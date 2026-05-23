import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { groupId } = await params;

    // 1. Verify that the current user is the CREATOR (Leader) of this group
    const senderMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!senderMembership || senderMembership.role !== "CREATOR") {
      return NextResponse.json(
        { error: "Apenas o líder do desafio pode visualizar as solicitações de entrada." },
        { status: 403 }
      );
    }

    // 2. Fetch all members with status "REQUESTED" for this group
    const requests = await prisma.groupMember.findMany({
      where: {
        groupId,
        status: "REQUESTED",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            profilePhotoUrl: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    const mappedRequests = requests.map((req) => ({
      id: req.id,
      joinedAt: req.joinedAt,
      role: req.role,
      status: req.status,
      user: req.user,
    }));

    return NextResponse.json({ requests: mappedRequests });
  } catch (error) {
    console.error("Error in GET /api/groups/[groupId]/requests:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao listar solicitações." },
      { status: 500 }
    );
  }
}
