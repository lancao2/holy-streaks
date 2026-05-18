import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (sessionId) {
    try {
      await prisma.session.delete({ where: { id: sessionId } });
    } catch (e) {
      // Ignored if session already deleted
    }
    cookieStore.delete("session_id");
  }

  redirect("/login");
}

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (sessionId) {
    try {
      await prisma.session.delete({ where: { id: sessionId } });
    } catch (e) {
      // Ignored if session already deleted
    }
    cookieStore.delete("session_id");
  }

  return Response.json({ success: true });
}
