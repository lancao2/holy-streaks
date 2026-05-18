import { getCurrentUser } from "../lib/auth";
import { redirect } from "next/navigation";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  // If the user is not authenticated, redirect to login
  if (!user) {
    redirect("/login");
  }

  // If the user already has a username, onboarding is complete. Redirect home.
  if (user.username) {
    redirect("/");
  }

  return <OnboardingForm user={user} />;
}
