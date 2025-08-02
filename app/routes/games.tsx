import type { Route } from "./+types/games";
import {Link, useLoaderData} from "react-router";
import {store} from "~/.server/db/store";
import {CalendarIcon, ClockIcon, UserGroupIcon} from "@heroicons/react/16/solid";
import React from "react";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const games = await store.games.getAllGames();

  return {games};
}

export default function Games({
                                loaderData,
                              }: Route.ComponentProps) {

  const {games} = loaderData;

  return <main className="p-6 max-w-2xl mx-auto">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Upcoming Matches</h1>
      <Link
        to="/games/create"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        + Add Game
      </Link>
    </div>
    <ul className="space-y-4">
      {games.map((game) => (
        <li
          key={game.id}
          className="border p-4 rounded shadow-sm hover:bg-gray-50 transition"
        >
          <Link to={`/games/${game.id}`} className="block">
            <p className="flex items-center gap-2 mb-2">
              <CalendarIcon className="w-6 h-6 text-blue-600"/>
              <span className="text-lg font-semibold">
                  {new Date(game.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
            </span>
            </p>
              <p className="flex items-center gap-3 mb-2">
                <ClockIcon className="w-6 h-6 text-blue-600"/>
                <span className="text-lg font-semibold">
      {game.startTime.slice(0, 5)} - {game.endTime.slice(0, 5)}
    </span>
              </p>
            <p className="flex items-center gap-2 mb-2">
              <UserGroupIcon className={"w-6 h-6 text-blue-600"} />
              <span className={"text-lg font-semibold"}>
                {game.enrolledPlayers.length} / {game.maxPlayers}
              </span>
            </p>
            <p className="text-sm text-gray-600">{game.location}</p>
          </Link>
        </li>
      ))}
    </ul>
  </main>;
}