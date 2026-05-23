import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Não autorizado. Por favor, faça login." }, { status: 401 });
    }

    const body = await request.json();
    const { showPrayerPhotos } = body;

    if (showPrayerPhotos === undefined || typeof showPrayerPhotos !== "boolean") {
      return NextResponse.json({ error: "Configuração 'showPrayerPhotos' inválida." }, { status: 400 });
    }

    // Update the user's privacy settings
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        showPrayerPhotos,
      },
    });

    return NextResponse.json({ 
      success: true, 
      showPrayerPhotos: updatedUser.showPrayerPhotos 
    });
  } catch (error) {
    console.error("Error in privacy POST route:", error);
    return NextResponse.json({ error: "Erro interno no servidor ao salvar privacidade." }, { status: 500 });
  }
}
