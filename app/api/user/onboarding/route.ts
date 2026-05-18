import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Não autorizado. Por favor, faça login." }, { status: 401 });
    }

    // If the user already has a username, do not allow overriding via onboarding
    if (user.username) {
      return NextResponse.json({ error: "Onboarding já concluído para esta conta." }, { status: 400 });
    }

    const body = await request.json();
    const { username, birthDate } = body;

    if (!username || !birthDate) {
      return NextResponse.json({ error: "Nickname e data de nascimento são obrigatórios." }, { status: 400 });
    }

    const normalizedUsername = username.trim().toLowerCase();

    // 1. Validate Nickname Format
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(normalizedUsername)) {
      return NextResponse.json({ 
        error: "O nickname deve conter entre 3 e 30 caracteres e usar apenas letras, números, hífen (-) ou underline (_)." 
      }, { status: 400 });
    }

    // 2. Validate Birth Date
    const parsedBirthDate = new Date(birthDate);
    if (isNaN(parsedBirthDate.getTime())) {
      return NextResponse.json({ error: "Data de nascimento inválida." }, { status: 400 });
    }

    // Prevent birth dates in the future
    if (parsedBirthDate > new Date()) {
      return NextResponse.json({ error: "A data de nascimento não pode ser no futuro." }, { status: 400 });
    }

    // 3. Check uniqueness of Nickname
    const existingUser = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Este nickname já está em uso." }, { status: 400 });
    }

    // 4. Update the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        username: normalizedUsername,
        birthDate: parsedBirthDate,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in onboarding POST route:", error);
    return NextResponse.json({ error: "Erro interno no servidor ao salvar dados." }, { status: 500 });
  }
}
