import {data, redirect} from "react-router";
import {commitSession, getSession} from "~/.server/session";
import type { Route } from "./+types/login";
import {validateCredentials} from "~/.server/domain/auth";

export async function loader({
                               request,
                             }: Route.LoaderArgs) {
  const session = await getSession(
    request.headers.get("Cookie"),
  );

  if (session.has("user")) {
    // Redirect to the home page if they are already signed in.
    return redirect("/");
  }

  return data(
    { error: session.get("error") },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    },
  );
}

export async function action({
                               request,
                             }: Route.ActionArgs) {
  const session = await getSession(
    request.headers.get("Cookie"),
  );
  const form = await request.formData();
  const username = form.get("username");
  const password = form.get("password");

  // Validate input types
  if (typeof username !== "string" || typeof password !== "string") {
    session.flash("error", "Invalid form submission.");
    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  // Trim and check for empty values
  if (username.trim() === "" || password.trim() === "") {
    session.flash("error", "Username and password are required.");
    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  try {
    const user = await validateCredentials(
      {
        username,
        password,
      },
    );

    session.set("user", user);

    // Login succeeded, send them to the home page.
    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
  });
  } catch (err) {
    // Handle authentication error (e.g., wrong password)
    session.flash("error", "Invalid username or password.");
    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }
}

export default function Login({
                                loaderData,
                              }: Route.ComponentProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Sign in to your account</h1>

        {loaderData?.error && (
          <div className="mb-4 text-red-600 text-sm text-center">
            {loaderData.error}
          </div>
        )}

        <form method="POST" className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              name="username"
              id="username"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
