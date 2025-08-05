import { redirect } from "react-router";
import { getSession } from "~/.server/session";
import type { Route } from "./+types/login";
import LoginPage from "~/login/loginPage";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.has("userId")) {
    // Redirect to the home page if they are already signed in.
    return redirect("/");
  }
}

export default function Login() {
  return <LoginPage />;
}
