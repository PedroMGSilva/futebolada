import type { Route } from "./+types/game-details";
import { store } from "app/.server/db/operations";
import { Form, Link, redirect } from "react-router";
import { getSession } from "~/.server/session";
import {
  CalendarIcon,
  ClockIcon,
  CurrencyEuroIcon,
} from "@heroicons/react/16/solid";
import { v4 as uuidv4 } from "uuid";
import { useState } from "react";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const gameId = params.gameId;

  const userId = session.get("userId")!!;
  const game = await store.games.getGameById(gameId);
  const guests = await store.guests.getAllGuests();

  if (game === null) {
    throw new Response("Game not found", { status: 404 });
  }

  const enrolledGuestIds = game.playersEnrolled
    .map((pe) => pe.player.guest?.id)
    .filter((id): id is string => !!id); // remove nulls and undefined

  const availableGuests = guests.filter(
    (guest) => !enrolledGuestIds.includes(guest.id)
  );

  return { game, guests: availableGuests, userId };
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId")!!;

  if (!userId) return redirect("/login");

  const gameId = params.gameId;
  if (!gameId) throw new Response("Game ID required", { status: 400 });

  const formData = await request.formData();
  const actionType = formData.get("_action");

  if (actionType === "unenroll") {
    const playerEnrolledId = formData.get("playerEnrolledId");
    if (!playerEnrolledId || typeof playerEnrolledId !== "string") {
      throw new Response("Missing playerEnrolledId", { status: 400 });
    }

    const playerEnrolled = await store.playersEnrolled.getPlayerEnrolledById(playerEnrolledId);
    if (!playerEnrolled) {
      throw new Response("Player not found", { status: 400 });
    }

    if(playerEnrolled.createdBy !== userId) {
      console.log("ai o crl", playerEnrolled.createdBy, userId);
      throw new Response("You are not authorized to unenroll this player", { status: 403 });
    }

    await store.games.unenrollFromGame({ gameId, playerId: playerEnrolled.playerId });

  } else if (actionType === "enroll") {
    const game = await store.games.getGameById(gameId);
    if (!game) throw new Response("Game not found", { status: 404 });

    const position = Number(formData.get("position"));
    if (!position || position < 1 || position > game.maxPlayers) {
      throw new Response("Invalid position", { status: 400 });
    }

    const player = await store.players.getByUserId(userId);
    if (!player) throw new Response("Player not found", { status: 400 });

    const playerEnrolledId = uuidv4();
    await store.games.enrollInGame({
      playerEnrolledId,
      gameId,
      playerId: player.id,
      position,
      actorId: userId,
    });

  } else if (actionType === "enrollGuest") {
    const game = await store.games.getGameById(gameId);
    if (!game) throw new Response("Game not found", { status: 404 });

    const guestName = formData.get("guestName");
    const position = Number(formData.get("position"));

    if (!guestName || typeof guestName !== "string" || isNaN(position)) {
      return { error: "All fields are required" };
    }

    if (position < 1 || position > game.maxPlayers) {
      throw new Response("Invalid position", { status: 400 });
    }

    let guest = await store.guests.findGuestByName({ name: guestName });
    let guestId: string, playerId: string;

    console.log("o guest", guest);
    if (!guest) {
      guestId = uuidv4();
      playerId = uuidv4();
      await store.guests.createGuestAndPlayer({
        guestId,
        playerId,
        name: guestName,
        actorId: userId,
      });
    } else {
      guestId = guest.id;
      const player = await store.players.getByGuestId(guestId);
      console.log("o player", player);
      if (!player) throw new Response("Player not found for guest", { status: 400 });
      playerId = player.id;
    }

    const playerEnrolledId = uuidv4();
    await store.games.enrollInGame({
      playerEnrolledId,
      gameId,
      playerId,
      position,
      actorId: userId,
    });
  }

  return redirect(`/games/${gameId}`);
}

export default function GameDetails({ loaderData }: Route.ComponentProps) {
  const { game, userId, guests } = loaderData;
  const [guestInputSlot, setGuestInputSlot] = useState<number | null>(null);
  const [guestName, setGuestName] = useState("");

  const isEnrolled = game.playersEnrolled.some(
    (p) => p.player.user?.id === userId
  );

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center md:text-left">
        Game Details
      </h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Game Info */}
        <section className="md:w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="flex items-center gap-3 mb-6">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-semibold">
              {new Date(game.date).toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>
          <p className="flex items-center gap-3 mb-6">
            <ClockIcon className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-semibold">
              {game.startTime.slice(0, 5)} - {game.endTime.slice(0, 5)}
            </span>
          </p>
          <p className="flex items-center gap-3 mb-6">
            <CurrencyEuroIcon className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-semibold">
              {(game.price / 100).toFixed(2)}
            </span>
          </p>

          <div className="mt-8">
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

        {/* Players */}
        <section className="md:w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">
            Enrolled Players ({game.playersEnrolled.length}/{game.maxPlayers})
          </h2>

          <ul className="flex-grow overflow-auto list-none mb-6 space-y-2">
            {[...Array(game.maxPlayers)].map((_, i) => {
              const position = i + 1;
              const playerEnrolled = game.playersEnrolled.find(
                (p) => p.position === position
              );

              const canRemove =
                playerEnrolled?.createdBy === userId;

              return (
                <li
                  key={i}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <span>
                    {playerEnrolled ? (
                      playerEnrolled.player.user?.name ||
                      playerEnrolled.player.guest?.name ||
                      "Unknown"
                    ) : (
                      <span className="text-gray-400 italic">Empty Slot</span>
                    )}
                  </span>

                  {canRemove && (
                    <Form method="post">
                      <input
                        type="hidden"
                        name="_action"
                        value="unenroll"
                      />
                      <input
                        type="hidden"
                        name="playerEnrolledId"
                        value={playerEnrolled.id}
                      />
                      <button
                        type="submit"
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </Form>
                  )}

                  {/* Available slot actions */}
                  {!playerEnrolled && (
                    <>
                      {/* Guest form (always rendered, hidden when not active) */}
                      <Form
                        method="post"
                        className={`flex gap-2 items-center transition-opacity duration-200 ${
                          guestInputSlot === position
                            ? "opacity-100 visible"
                            : "opacity-0 invisible h-0 overflow-hidden"
                        }`}
                      >
                        <input type="hidden" name="_action" value="enrollGuest" />
                        <input type="hidden" name="position" value={position} />
                        <input
                          name="guestName"
                          type="text"
                          list="guest-names-list"
                          placeholder="Guest name"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          required
                          className="rounded border px-2 py-1 text-sm"
                          autoComplete="off"
                        />
                        <datalist id="guest-names-list">
                          {guests.map((guest) => (
                            <option key={guest.name} value={guest.name} />
                          ))}
                        </datalist>

                        <button
                          type="submit"
                          className="text-sm text-green-600 hover:text-green-800"
                          onClick={() => setGuestInputSlot(null)}
                        >
                          Add Guest
                        </button>
                        <button
                          type="button"
                          className="text-sm text-gray-500 hover:text-gray-700"
                          onClick={() => {
                            setGuestInputSlot(null);
                            setGuestName("");
                          }}
                        >
                          Cancel
                        </button>
                      </Form>

                      {/* Enroll/Add Guest buttons (visible only when form hidden) */}
                      {guestInputSlot !== position && (
                        <div className="flex gap-2">
                          {!isEnrolled && (
                            <Form method="post">
                              <input type="hidden" name="_action" value="enroll" />
                              <input type="hidden" name="position" value={position} />
                              <button
                                type="submit"
                                className="text-sm text-green-600 hover:text-green-800"
                              >
                                Enroll me
                              </button>
                            </Form>
                          )}
                          <button
                            type="button"
                            className="text-sm text-blue-600 hover:text-blue-800"
                            onClick={() => setGuestInputSlot(position)}
                          >
                            Add Guest
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
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
