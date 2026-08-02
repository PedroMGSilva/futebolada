import { redirect } from "react-router";
import { destroySession, getSession } from "~/.server/session";
import { store } from "~/.server/db/operations";
import type { User } from "~/.server/db/operations/users";

export async function requireUser(request: Request): Promise<User> {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  if (!userId) {
    throw redirect("/login");
  }

  const user = await store.users.getUserById(userId);

  if (!user) {
    throw redirect("/login", {
      headers: { "Set-Cookie": await destroySession(session) },
    });
  }

  return user;
}

export async function requireAdmin(request: Request): Promise<User> {
  const user = await requireUser(request);

  if (user.role !== "admin") {
    throw new Response("You are not authorized to do that", { status: 403 });
  }

  return user;
}
