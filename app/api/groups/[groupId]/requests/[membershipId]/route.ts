import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

// POST /api/groups/[groupId]/requests/[membershipId] - Approve join request
export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string; membershipId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { groupId, membershipId } = await params;

    // 1. Verify that the current user is the CREATOR of this group
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
        { error: "Apenas o líder do desafio pode aprovar solicitações de entrada." },
        { status: 403 }
      );
    }

    // 2. Verify that the membership request exists, is pending, and matches the group
    const targetMembership = await prisma.groupMember.findUnique({
      where: { id: membershipId },
    });

    if (!targetMembership || targetMembership.groupId !== groupId) {
      return NextResponse.json({ error: "Solicitação de entrada não encontrada." }, { status: 404 });
    }

    if (targetMembership.status !== "REQUESTED") {
      return NextResponse.json(
        { error: "Esta solicitação já foi processada ou não é uma solicitação pendente." },
        { status: 400 }
      );
    }

    // 3. Update target membership status to ACCEPTED
    const approvedMembership = await prisma.groupMember.update({
      where: { id: membershipId },
      data: {
        status: "ACCEPTED",
        joinedAt: new Date(), // Reset joinedAt to the actual approval date
      },
    });

    return NextResponse.json({ success: true, membership: approvedMembership });
  } catch (error) {
    console.error("Error in POST /api/groups/[groupId]/requests/[membershipId]:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao aprovar solicitação." },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[groupId]/requests/[membershipId] - Reject join request
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ groupId: string; membershipId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { groupId, membershipId } = await params;

    // 1. Verify that the current user is the CREATOR of this group
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
        { error: "Apenas o líder do desafio pode recusar solicitações de entrada." },
        { status: 403 }
      );
    }

    // 2. Verify that the membership request exists, is pending, and matches the group
    const targetMembership = await prisma.groupMember.findUnique({
      where: { id: membershipId },
    });

    if (!targetMembership || targetMembership.groupId !== groupId) {
      return NextResponse.json({ error: "Solicitação de entrada não encontrada." }, { status: 404 });
    }

    if (targetMembership.status !== "REQUESTED") {
      return NextResponse.json(
        { error: "Esta solicitação já foi processada e não pode ser recusada." },
        { status: 400 }
      );
    }

    // 3. Delete the target membership record
    await prisma.groupMember.delete({
      where: { id: membershipId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/groups/[groupId]/requests/[membershipId]:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao recusar solicitação." },
      { status: 500 }
    );
  }
}
