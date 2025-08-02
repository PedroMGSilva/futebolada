import {data, Link, redirect} from "react-router";
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
  const email = form.get("email");
  const password = form.get("password");

  // Validate input types
  if (typeof email !== "string" || typeof password !== "string") {
    session.flash("error", "Invalid form submission.");
    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  // Trim and check for empty values
  if (email.trim() === "" || password.trim() === "") {
    session.flash("error", "Email and password are required.");
    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  try {
    const user = await validateCredentials(
      {
        email,
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
    session.flash("error", "Invalid email or password.");
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Sign in to your account</h1>

        {loaderData?.error && (
          <div className="mb-4 text-red-600 text-sm text-center">
            {loaderData.error}
          </div>
        )}

        <form method="POST" className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
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

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
