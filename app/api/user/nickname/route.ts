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
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: "Nickname é obrigatório." }, { status: 400 });
    }

    const normalizedUsername = username.trim().toLowerCase();

    // 1. Validate Nickname Format (3-30 chars, alphanumeric, hyphens, underscores)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(normalizedUsername)) {
      return NextResponse.json({ 
        error: "O nickname deve conter entre 3 e 30 caracteres e usar apenas letras, números, hífen (-) ou underline (_)." 
      }, { status: 400 });
    }

    // 2. Check if the username is already in use by another user
    const existingUser = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json({ error: "Este nickname já está em uso." }, { status: 400 });
    }

    // 3. Update the user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: normalizedUsername,
      },
    });

    return NextResponse.json({ 
      success: true, 
      username: updatedUser.username 
    });
  } catch (error) {
    console.error("Error in nickname POST route:", error);
    return NextResponse.json({ error: "Erro interno no servidor ao salvar nickname." }, { status: 500 });
  }
}
