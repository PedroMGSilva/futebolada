import type { Route } from "./+types/past-games";
import { Link, redirect, useSearchParams } from "react-router";
import { store } from "app/.server/db/operations";
import { getSession } from "~/.server/session";
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
} from "@heroicons/react/16/solid";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("userId")) {
    return redirect("/login");
  }

  const user = await store.users.getUserById(session.get("userId")!);

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  const role = user.role;

  const GAMES_PER_PAGE = 10;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const offset = (page - 1) * GAMES_PER_PAGE;

  const { games, total } = await store.games.getPastGames({
    limit: GAMES_PER_PAGE,
    offset,
  });

  return {
    games,
    currentPage: page,
    totalPages: Math.ceil(total / GAMES_PER_PAGE),
    role,
  };
}

export default function PastGames({ loaderData }: Route.ComponentProps) {
  const { games, currentPage, totalPages, role } = loaderData;
  const [searchParams] = useSearchParams();

  const createPageLink = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(page));
    return `/games/past?${newParams.toString()}`;
  };

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Games</h1>
        {role === "admin" && (
          <Link
            to="/games/create"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            + Add Game
          </Link>
        )}
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <Link
            to="/"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Upcoming
          </Link>
          <span
            className="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            aria-current="page"
          >
            Past
          </span>
        </nav>
      </div>

      {games.length > 0 ? (
        <ul className="space-y-4">
          {games.map((game) => (
            <li
              key={game.id}
              className="border p-4 rounded shadow-sm hover:bg-gray-50 transition"
            >
              <Link to={`/games/${game.id}`} className="block">
                <p className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                  <span className="text-lg font-semibold">
                    {new Date(game.date).toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </p>
                <p className="flex items-center gap-3 mb-2">
                  <ClockIcon className="w-6 h-6 text-blue-600" />
                  <span className="text-lg font-semibold">
                    {game.startTime.slice(0, 5)} - {game.endTime.slice(0, 5)}
                  </span>
                </p>
                <p className="flex items-center gap-2 mb-2">
                  <UserGroupIcon className={"w-6 h-6 text-blue-600"} />
                  <span className={"text-lg font-semibold"}>
                    {game.playersEnrolled.length} / {game.maxPlayers}
                  </span>
                </p>
                <p className="text-sm text-gray-600">{game.location}</p>
                {game.winningTeam && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-center">
                      Winner:{" "}
                      <span className="capitalize">{game.winningTeam}</span>
                    </p>
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-10 border rounded-lg">
          <p className="text-gray-500">No past games.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 sm:px-0 mt-10 pt-4"
          aria-label="Pagination"
        >
          <div className="flex-1 flex justify-between sm:justify-end gap-4">
            {currentPage > 1 ? (
              <Link
                to={createPageLink(currentPage - 1)}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Previous
              </Link>
            ) : (
              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-500 cursor-not-allowed">
                Previous
              </span>
            )}
            {currentPage < totalPages ? (
              <Link
                to={createPageLink(currentPage + 1)}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Next
              </Link>
            ) : (
              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-500 cursor-not-allowed">
                Next
              </span>
            )}
          </div>
        </nav>
      )}
    </main>
  );
}
