import { Form, Link, Outlet, redirect } from "react-router";
import { destroySession, getSession } from "~/.server/session";
import type { Route } from "../../.react-router/types/app/+types/root";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("userId")) {
    // Allow access to the login page even if not authenticated
    if (url.pathname === "/login" || url.pathname === "/register") {
      return null;
    }

    const headers = new Headers({
      "Set-Cookie": await destroySession(session),
    });

    return redirect("/login", { headers });
  }
}

export const action = async ({ request }: { request: Request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
};

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with logout */}
      <header className="bg-gray-100 dark:bg-gray-900 p-4 flex justify-between items-center shadow">
        <Link to={"/"} className="text-xl font-bold">
          Futebolada
        </Link>
        <Form method="post" action="/logout">
          <button
            type="submit"
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Log out
          </button>
        </Form>
      </header>

      {/* Main content */}
      <main className="flex-grow p-6">
        <Outlet />
      </main>

      {/* Optional footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 p-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Futebolada.org
      </footer>
    </div>
  );
}
