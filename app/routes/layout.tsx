import {Form, Outlet, redirect} from "react-router";
import {destroySession, getSession} from "~/.server/session";


export const action = async ({ request }: { request: Request }) => {
  const session = await getSession(
    request.headers.get("Cookie"),
  );
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
        <h1 className="text-xl font-bold">Futebolada</h1>
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
        &copy; {new Date().getFullYear()} Your Company
      </footer>
    </div>
  );
}