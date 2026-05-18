import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { uploadToCloudinary } from "../../../lib/cloudinary";

// POST /api/user/profile-photo - Upload and save a new user profile photo
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhuma imagem foi enviada." }, { status: 400 });
    }

    // Read image file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload directly to Cloudinary
    let publicPhotoUrl: string;
    try {
      publicPhotoUrl = await uploadToCloudinary(buffer, "holy-streaks/profiles");
    } catch (uploadError: any) {
      console.error("Cloudinary upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message || "Falha ao enviar imagem para o Cloudinary." },
        { status: 400 }
      );
    }

    // Update User record in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        profilePhotoUrl: publicPhotoUrl,
      },
    });

    return NextResponse.json({
      success: true,
      profilePhotoUrl: publicPhotoUrl,
    });
  } catch (error) {
    console.error("Error in POST /api/user/profile-photo:", error);
    return NextResponse.json({ error: "Erro interno no servidor ao salvar foto de perfil." }, { status: 500 });
  }
}
