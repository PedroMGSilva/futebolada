import { getSession, destroySession } from "~/.server/session";
import type { Route } from "./+types/logout";
import { Form, Link, redirect } from "react-router";

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export default function LogoutRoute() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <p className="mb-6 text-lg font-semibold text-gray-700">
          Are you sure you want to log out?
        </p>
        <Form method="post" className="mb-4">
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded transition"
          >
            Logout
          </button>
        </Form>
        <Link
          to="/"
          className="inline-block text-blue-600 hover:underline font-medium"
        >
          Never mind
        </Link>
      </div>
    </main>
  );
}
