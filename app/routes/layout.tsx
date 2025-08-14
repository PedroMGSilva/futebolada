import { Form, Link, Outlet, redirect } from "react-router";
import { destroySession, getSession } from "~/.server/session";
import type { Route } from "../../.react-router/types/app/+types/root";
import { useEffect, useRef, useState } from "react";

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
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-100 dark:bg-gray-900 p-4 flex justify-between items-center shadow">
        <Link to={"/"} className="text-xl font-bold">
          Futebolada
        </Link>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition focus:outline-none cursor-pointer"
            aria-haspopup="true"
            aria-expanded={open}
          >
            <span className="font-medium text-gray-700 dark:text-gray-200">
              Menu
            </span>
            <svg
              className={`w-4 h-4 ml-1 transition-transform ${open ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-10">
              <Link
                to="/profile"
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setOpen(false)}
              >
                Profile
              </Link>
              <Form
                method="post"
                action="/logout"
                onSubmit={() => setOpen(false)}
              >
                <button
                  type="submit"
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  Log out
                </button>
              </Form>
            </div>
          )}
        </div>
      </header>
      <main className="flex-grow p-6">
        <Outlet />
      </main>
      <footer className="bg-gray-100 dark:bg-gray-900 p-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Futebolada.org
      </footer>
    </div>
  );
}
