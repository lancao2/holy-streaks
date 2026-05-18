import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username")?.trim().toLowerCase();

    if (!username) {
      return NextResponse.json({ error: "Nickname é obrigatório." }, { status: 400 });
    }

    // Validation: 3-30 chars, alphanumeric + hyphens + underscores
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ 
        available: false, 
        error: "O nickname deve conter entre 3 e 30 caracteres e usar apenas letras, números, hífen (-) ou underline (_)." 
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json({ available: false, error: "Este nickname já está em uso." });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error("Error checking username:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
