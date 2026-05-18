import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

// POST /api/groups/invitations/[membershipId] - Accept invitation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { membershipId } = await params;

    // Verify that the membership exists, is pending, and belongs to the current user
    const membership = await prisma.groupMember.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
    }

    if (membership.userId !== user.id) {
      return NextResponse.json({ error: "Você não tem permissão para responder a este convite." }, { status: 403 });
    }

    if (membership.status !== "PENDING") {
      return NextResponse.json({ error: "Este convite já foi processado." }, { status: 400 });
    }

    // Update status to ACCEPTED
    const updatedMembership = await prisma.groupMember.update({
      where: { id: membershipId },
      data: {
        status: "ACCEPTED",
        joinedAt: new Date(), // Reset joinedAt to the actual acceptance date
      },
    });

    return NextResponse.json({ success: true, membership: updatedMembership });
  } catch (error) {
    console.error("Error in POST /api/groups/invitations/[membershipId]:", error);
    return NextResponse.json({ error: "Erro interno no servidor ao aceitar convite." }, { status: 500 });
  }
}

// DELETE /api/groups/invitations/[membershipId] - Decline invitation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { membershipId } = await params;

    // Verify that the membership exists, is pending, and belongs to the current user
    const membership = await prisma.groupMember.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
    }

    if (membership.userId !== user.id) {
      return NextResponse.json({ error: "Você não tem permissão para responder a este convite." }, { status: 403 });
    }

    // Delete the membership record to decline
    await prisma.groupMember.delete({
      where: { id: membershipId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/groups/invitations/[membershipId]:", error);
    return NextResponse.json({ error: "Erro interno no servidor ao recusar convite." }, { status: 500 });
  }
}
