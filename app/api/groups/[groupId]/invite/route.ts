import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(
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
      return NextResponse.json({ error: "Apenas o líder (criador) do desafio pode convidar outros membros." }, { status: 403 });
    }

    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json({ error: "O nome de usuário (nickname) é obrigatório." }, { status: 400 });
    }

    const targetUsername = username.trim().toLowerCase();

    // 2. Find target user by username
    const targetUser = await prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // 3. Verify if target user is already a member of the group
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.status === "PENDING") {
        return NextResponse.json({ error: "Este usuário já possui um convite pendente para este grupo." }, { status: 400 });
      }
      return NextResponse.json({ error: "Este usuário já é membro deste grupo." }, { status: 400 });
    }

    // 4. Create the new GroupMember
    const newMember = await prisma.groupMember.create({
      data: {
        groupId,
        userId: targetUser.id,
        role: "MEMBER",
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      member: {
        id: newMember.id,
        role: newMember.role,
        joinedAt: newMember.joinedAt,
        user: newMember.user,
      } 
    });
  } catch (error) {
    console.error("Error in POST /api/groups/[groupId]/invite:", error);
    return NextResponse.json({ error: "Erro interno no servidor ao convidar amigo." }, { status: 500 });
  }
}
