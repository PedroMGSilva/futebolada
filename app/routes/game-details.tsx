import type { Route } from "./+types/game-details";
import {store} from "~/.server/db/store";
import {Form, Link, redirect} from "react-router";
import {getSession} from "~/.server/session";
import React from "react";
import {CalendarIcon, ClockIcon} from "@heroicons/react/16/solid";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const gameId = params.gameId;

  const user = session.get("user");

  if (!user) {
    // Not logged in, redirect to login
    return redirect("/login");
  }

  const game = await store.games.getGame(gameId);

  return {game, user};
}


export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    // Not logged in, redirect to login
    return redirect("/login");
  }

  const gameId = params.gameId;
  if (!gameId) {
    throw new Response("Game ID required", { status: 400 });
  }

  const form = await request.formData();
  const actionType = form.get("_action");

  if (actionType === "unenroll") {
    await store.games.unenrollFromGame({ gameId, userId: user.id });
  } else if(actionType === "enroll") {
    await store.games.enrollInGame({ gameId, userId: user.id });
  }

  return redirect(`/games/${gameId}`); // Reload current game details page after enrolling
}

export default function GameDetails({
                                      loaderData,
                                    }: Route.ComponentProps) {
  const { game, user } = loaderData;
  const isEnrolled = game.enrolledPlayers.some(p => p.id === user.id);

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center md:text-left">Game Details</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left panel: game details */}
        <section className="md:w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="flex items-center gap-3 mb-6">
            <CalendarIcon className="w-6 h-6 text-blue-600"/>
            <span className="text-xl font-semibold">
                  {new Date(game.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </p>
          <p className="flex items-center gap-3 mb-6">
            <ClockIcon className="w-6 h-6 text-green-600"/>
            <span className="text-xl font-semibold">
      {game.startTime.slice(0, 5)} - {game.endTime.slice(0, 5)}
    </span>
          </p>

          <div className="mt-8 flex-grow">
            <iframe
              title="Game Location Map"
              className="w-full h-100 rounded-md border"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${game.latitude},${game.longitude}&z=15&output=embed`}
            />
          </div>
        </section>

        {/* Right panel: enrolled players + enroll button */}
        <section className="md:w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">
            Enrolled Players ({game.enrolledPlayers.length}/{game.maxPlayers})
          </h2>
          <ul className="flex-grow overflow-auto list-none mb-6 space-y-2">
            {[...Array(game.maxPlayers)].map((_, i) => {
              const player = game.enrolledPlayers[i];
              return (
                <li key={i} className="flex justify-between items-center border-b pb-2">
          <span>
            {player ? player.name : <span className="text-gray-400 italic">Empty Slot</span>}
          </span>
                  {player?.id === user.id && (
                    <Form method="post">
                      <input type="hidden" name="_action" value="unenroll"/>
                      <button
                        type="submit"
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </Form>
                  )}
                </li>
              );
            })}
          </ul>

          <Form method="post" className="mt-auto">
            <input type="hidden" name="_action" value="enroll"/>
            <button
              type="submit"
              disabled={isEnrolled || game.enrolledPlayers.length >= game.maxPlayers}
              className={`w-full py-2 px-4 rounded text-white ${
                isEnrolled || game.enrolledPlayers.length >= game.maxPlayers
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } transition`}
            >
              {isEnrolled
                ? "Already enrolled"
                : game.enrolledPlayers.length >= game.maxPlayers
                  ? "Game is full"
                  : "Enroll me"}
            </button>
          </Form>
        </section>
      </div>

      <div className="mt-6 text-center md:text-left">
        <Link to="/" className="text-blue-600 hover:underline">
          &larr; Back to games
        </Link>
      </div>
    </main>
  );
}