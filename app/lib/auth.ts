import { cookies } from "next/headers";
import { prisma } from "./prisma";

/**
 * Retrieves the currently authenticated user based on the session cookie.
 * Returns the user object, or null if not authenticated or session expired.
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;
    if (!sessionId) return null;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) return null;

    // Check if the session is expired
    if (session.expiresAt < new Date()) {
      // Clean up expired session
      prisma.session.delete({ where: { id: sessionId } }).catch((err) => 
        console.error("Failed to delete expired session:", err)
      );
      return null;
    }

    return session.user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}
