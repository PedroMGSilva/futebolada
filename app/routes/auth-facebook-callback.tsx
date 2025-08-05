import type { Route } from "../../.react-router/types/app/routes/+types/register";
import { commitSession, getSession } from "~/.server/session";
import { redirect } from "react-router";
import {
  getAccessToken,
  getFacebookUserProfile,
} from "~/.server/auth/facebook";
import { store } from "~/.server/db/operations";
import { v4 as uuidv4 } from "uuid";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.has("userId")) {
    // Redirect to the home page if they are already signed in.
    return redirect("/");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";

  if (!code) {
    throw new Error("No code provided");
  }

  const accessToken = await getAccessToken(code);
  const userProfile = await getFacebookUserProfile(accessToken);

  if (!userProfile.email) {
    throw new Error("Google user info does not contain an email.");
  }

  // Check if user already exists in DB by email
  let user = await store.users.getUserByEmail(userProfile.email); //FIXME IT SHUOLD FIND BY AUTH PROVIDER ID

  if (!user) {
    const userId = uuidv4();
    const playerId = uuidv4();
    const { user: createdUser } = await store.users.createUserAndPlayer({
      userId: userId,
      playerId: playerId,
      email: userProfile.email,
      name: userProfile.name || "No name",
      password: null,
      authProvider: "facebook",
      authProviderId: userProfile.id,
    });

    user = createdUser;
  }

  session.set("userId", user.id);

  return redirect("/", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}
