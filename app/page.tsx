import { getCurrentUser } from "./lib/auth";
import { redirect } from "next/navigation";
import GroupsDashboard from "./components/GroupsDashboard";
import LandingPage from "./components/LandingPage";

export default async function Home() {
  const user = await getCurrentUser();

  if (user && !user.username) {
    redirect("/onboarding");
  }

  const baseUrl = process.env.MY_APP_BASE_URL || "";

  return user ? <GroupsDashboard user={user as any} baseUrl={baseUrl} /> : <LandingPage />;
}

