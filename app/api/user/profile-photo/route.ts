import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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

    // Create unique filename
    const fileExtension = file.name.split(".").pop() || "jpg";
    const sanitizedFileName = `profile_${user.id}_${Date.now()}.${fileExtension}`;
    const uploadDir = join(process.cwd(), "public", "uploads", "profile");

    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, sanitizedFileName);
    await writeFile(filePath, buffer);

    const publicPhotoUrl = `/uploads/profile/${sanitizedFileName}`;

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
