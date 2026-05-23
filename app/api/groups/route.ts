import { NextResponse } from "next/server";
import { getCurrentUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

// GET /api/groups - Retrieve list of groups the user belongs to
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    // Fetch all group memberships for this user, including Group details and total members count
    const memberships = await prisma.groupMember.findMany({
      where: { 
        userId: user.id,
        status: "ACCEPTED",
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
                profilePhotoUrl: true,
              },
            },
            members: {
              where: {
                status: "ACCEPTED",
              },
              select: {
                userId: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    const groups = memberships.map((membership) => ({
      id: membership.group.id,
      name: membership.group.name,
      description: membership.group.description,
      endDate: membership.group.endDate,
      allowMemberInvites: membership.group.allowMemberInvites,
      createdAt: membership.group.createdAt,
      creator: membership.group.creator,
      role: membership.role,
      joinedAt: membership.joinedAt,
      memberCount: membership.group.members.length,
    }));

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Error in GET /api/groups:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}

// POST /api/groups - Create a new group
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, endDate } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "O nome do desafio é obrigatório." }, { status: 400 });
    }

    if (name.length > 50) {
      return NextResponse.json({ error: "O nome do desafio não pode exceder 50 caracteres." }, { status: 400 });
    }

    let parsedEndDate: Date | null = null;
    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json({ error: "Data de término inválida." }, { status: 400 });
      }

      if (parsedEndDate <= new Date()) {
        return NextResponse.json({ error: "A data de término deve ser no futuro." }, { status: 400 });
      }
    }

    // Create Group and creator GroupMember in a single transaction
    const newGroup = await prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          endDate: parsedEndDate,
          creatorId: user.id,
        },
      });

      await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId: user.id,
          role: "CREATOR",
        },
      });

      return group;
    });

    return NextResponse.json({ success: true, group: newGroup }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/groups:", error);
    return NextResponse.json({ error: "Erro interno no servidor ao criar grupo." }, { status: 500 });
  }
}
