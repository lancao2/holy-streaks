import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("Google OAuth error callback:", error);
    return NextResponse.redirect(new URL("/login?error=google_cancelled", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: "Google OAuth credentials are not fully configured." },
        { status: 500 }
      );
    }

    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Failed to exchange Google OAuth code:", errText);
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", request.url));
    }

    const { access_token } = await tokenResponse.json();

    // 2. Fetch user profile information using access token
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userinfoResponse.ok) {
      console.error("Failed to fetch Google user info");
      return NextResponse.redirect(new URL("/login?error=fetch_userinfo_failed", request.url));
    }

    const profile = await userinfoResponse.json();
    const email = profile.email?.toLowerCase().trim();

    if (!email) {
      return NextResponse.redirect(new URL("/login?error=email_not_provided", request.url));
    }

    // 3. Find or create user in the database
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Split or extract first and last name from profile
      const firstName = profile.given_name || profile.name || "Google";
      const lastName = profile.family_name || "";
      
      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          passwordHash: null, // Nullable, as they logged in via OAuth
        },
      });
    }

    // 4. Create database session
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt,
      },
    });

    // 5. Set HTTP-Only session cookie
    const cookieStore = await cookies();
    cookieStore.set("session_id", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    // 6. Redirect to home/dashboard
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Error in Google callback handler:", error);
    return NextResponse.redirect(new URL("/login?error=internal_error", request.url));
  }
}
