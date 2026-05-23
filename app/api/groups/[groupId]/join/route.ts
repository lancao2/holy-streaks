import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

// GET /api/groups/[groupId]/join - Fetch public details of a group for the invite link
export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    // 1. Verify if the group exists and fetch its public info
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
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Desafio não encontrado." }, { status: 404 });
    }

    // 2. Count active (ACCEPTED) members
    const memberCount = await prisma.groupMember.count({
      where: {
        groupId,
        status: "ACCEPTED",
      },
    });

    // 3. Check if the current visitor is logged in and what their membership status is
    const user = await getCurrentUser();
    let userMembershipStatus = null;

    if (user) {
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: user.id,
          },
        },
        select: {
          status: true,
          role: true,
        },
      });
      userMembershipStatus = membership;
    }

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        endDate: group.endDate,
        creator: group.creator,
        memberCount,
      },
      userMembership: userMembershipStatus,
      isLoggedIn: !!user,
    });
  } catch (error) {
    console.error("Error in GET /api/groups/[groupId]/join:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao carregar convite." },
      { status: 500 }
    );
  }
}

// POST /api/groups/[groupId]/join - Request to join a group
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

    // 1. Verify if the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: "Desafio não encontrado." }, { status: 404 });
    }

    // 2. Check if a membership already exists
    const existingMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.status === "ACCEPTED") {
        return NextResponse.json(
          { error: "Você já é membro deste desafio." },
          { status: 400 }
        );
      }

      if (existingMembership.status === "REQUESTED") {
        return NextResponse.json({
          success: true,
          message: "Sua solicitação de participação já está pendente de aprovação pelo líder.",
        });
      }

      if (existingMembership.status === "PENDING") {
        // The creator had previously invited this user.
        // Joining via link will automatically ACCEPT the pending invitation.
        const updatedMembership = await prisma.groupMember.update({
          where: { id: existingMembership.id },
          data: {
            status: "ACCEPTED",
            joinedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          joined: true,
          message: "Você aceitou o convite pendente e entrou no desafio com sucesso!",
          membership: updatedMembership,
        });
      }
    }

    // 3. Create a new join request
    const newRequest = await prisma.groupMember.create({
      data: {
        groupId,
        userId: user.id,
        role: "MEMBER",
        status: "REQUESTED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Solicitação de participação enviada com sucesso! Aguarde a aprovação do líder.",
      membership: newRequest,
    });
  } catch (error) {
    console.error("Error in POST /api/groups/[groupId]/join:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao solicitar participação." },
      { status: 500 }
    );
  }
}
