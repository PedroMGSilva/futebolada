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
import { formatDate } from "~/utils";
import { config } from "~/.server/config";
import sender from "~/.server/waha/rateLimitedClient";

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const gameId = params.gameId;

  const userId = session.get("userId")!;

  if (!userId) return redirect("/login");

  const user = (await store.users.getUserById(session.get("userId")!))!;

  const game = await store.games.getGameById(gameId);
  const guests = await store.guests.getAllGuests();

  if (game === null) {
    throw new Response("Game not found", { status: 404 });
  }

  const enrolledGuestIds = game.playersEnrolled
    .map((pe) => pe.player.guest?.id)
    .filter((id): id is string => !!id); // remove nulls and undefined

  const availableGuests = guests.filter(
    (guest) => !enrolledGuestIds.includes(guest.id),
  );

  return { game, guests: availableGuests, userId, userRole: user.role };
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId")!;

  if (!userId) return redirect("/login");

  const gameId = params.gameId;
  if (!gameId) throw new Response("Game ID required", { status: 400 });

  const formData = await request.formData();
  const actionType = formData.get("_action");

  const game = await store.games.getGameById(gameId);
  if (!game) throw new Response("Game not found", { status: 404 });

  // Check if the game is over
  const now = new Date();
  const [hours, minutes] = game.endTime.split(":").map(Number);
  const gameEndDateTime = new Date(game.date);
  gameEndDateTime.setHours(hours, minutes);
  const isGameOver = now > gameEndDateTime;

  if (
    (actionType === "enroll" ||
      actionType === "unenroll" ||
      actionType === "enrollGuest") &&
    isGameOver
  ) {
    throw new Response("Cannot modify enrollment for a past game.", {
      status: 403,
    });
  }

  if (actionType === "unenroll") {
    const playerEnrolledId = formData.get("playerEnrolledId");
    if (!playerEnrolledId || typeof playerEnrolledId !== "string") {
      throw new Response("Missing playerEnrolledId", { status: 400 });
    }

    const playerEnrolled =
      await store.playersEnrolled.getPlayerEnrolledById(playerEnrolledId);
    if (!playerEnrolled) {
      throw new Response("Player not found", { status: 400 });
    }

    if (playerEnrolled.createdBy !== userId) {
      throw new Response("You are not authorized to unenroll this player", {
        status: 403,
      });
    }

    await store.games.unenrollFromGame({
      gameId,
      playerId: playerEnrolled.playerId,
    });

    sender.send(
      config.waha.chatId,
      `😢 *Desistência de última hora* 😢

*Jogo*: ${formatDate(game.date)}
*Hora*: ${game.startTime.slice(0, 5)} - ${game.endTime.slice(0, 5)}
*Inscritos*: ${game.playersEnrolled.length - 1} / ${game.maxPlayers}`,
    );
  } else if (actionType === "enroll") {
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

    sender.send(
      config.waha.chatId,
      `🚨 *Novo jogador inscrito!* 🚨

*Jogo*: ${formatDate(game.date)}
*Hora*: ${game.startTime.slice(0, 5)} - ${game.endTime.slice(0, 5)}
*Inscritos*: ${game.playersEnrolled.length + 1} / ${game.maxPlayers}`,
    );
  } else if (actionType === "enrollGuest") {
    const guestName = formData.get("guestName");
    const position = Number(formData.get("position"));

    if (!guestName || typeof guestName !== "string" || isNaN(position)) {
      return { error: "All fields are required" };
    }

    if (position < 1 || position > game.maxPlayers) {
      throw new Response("Invalid position", { status: 400 });
    }

    const guest = await store.guests.findGuestByName({ name: guestName });
    let guestId: string, playerId: string;

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
      if (!player)
        throw new Response("Player not found for guest", { status: 400 });
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

    sender.send(
      config.waha.chatId,
      `🚨 *Novo jogador inscrito!* 🚨

*Jogo*: ${formatDate(game.date)}
*Hora*: ${game.startTime.slice(0, 5)} - ${game.endTime.slice(0, 5)}
*Inscritos*: ${game.playersEnrolled.length + 1} / ${game.maxPlayers}`,
    );
  } else if (actionType === "declareWinner") {
    const user = await store.users.getUserById(userId);
    if (user?.role !== "admin") {
      throw new Response("Forbidden", { status: 403 });
    }

    const winningTeam = formData.get("winningTeam");

    if (
      winningTeam !== "white" &&
      winningTeam !== "black" &&
      winningTeam !== "draw"
    ) {
      throw new Response("Invalid winning team value", { status: 400 });
    }

    await store.games.setWinningTeam({
      gameId: gameId,
      winningTeam: winningTeam,
      actorId: userId,
    });
  }

  return redirect(`/games/${gameId}`);
}

export default function GameDetails({ loaderData }: Route.ComponentProps) {
  const { game, userId, guests, userRole } = loaderData;
  const [guestInputSlot, setGuestInputSlot] = useState<number | null>(null);
  const [guestName, setGuestName] = useState("");

  const isEnrolled = game.playersEnrolled.some(
    (p) => p.player.user?.id === userId,
  );

  const [hours, minutes] = game.endTime.split(":").map(Number);
  const gameEndDateTime = new Date(game.date);
  gameEndDateTime.setHours(hours, minutes);
  const isGameOver = new Date() > gameEndDateTime;

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center md:text-left mb-4 md:mb-0">
          Game Details
        </h1>
        <div className="flex items-center gap-4">
          {userRole === "admin" && !isGameOver && (
            <Link
              to={`/games/${game.id}/team-assignment`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            >
              Team Assignment
            </Link>
          )}
          <Link
            to={`/`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            &larr; Back to Games
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Game Info */}
        <section className="md:w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="flex items-center gap-3 mb-6">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-semibold">
              {formatDate(game.date)}
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

          {/* Winner Display */}
          {game.winningTeam && (
            <div className="mt-8 p-4 bg-green-100 dark:bg-green-900 rounded-lg text-center">
              <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                Winner: <span className="capitalize">{game.winningTeam}</span>
              </p>
            </div>
          )}

          {/* Declare Winner Form */}
          {userRole === "admin" && !game.winningTeam && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Declare Winner</h3>
              <Form method="post">
                <input type="hidden" name="_action" value="declareWinner" />
                <div className="flex items-center gap-4">
                  <select
                    name="winningTeam"
                    defaultValue=""
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="" disabled>
                      Select winner
                    </option>
                    <option value="white">White</option>
                    <option value="black">Black</option>
                    <option value="draw">Draw</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Save
                  </button>
                </div>
              </Form>
            </div>
          )}

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
                (p) => p.position === position,
              );

              const canRemove = playerEnrolled?.createdBy === userId;

              return (
                <li
                  key={i}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <span className="flex items-center">
                    {playerEnrolled ? (
                      <>
                        <span
                          className={
                            playerEnrolled.player.user?.id ===
                            "6b180f86-1c4f-437d-afa3-064654c18bb8" // Bruno USER ID
                              ? "font-medium text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 via-yellow-300 via-green-500 via-blue-500 to-violet-600 dark:from-red-400 dark:via-orange-300 dark:via-yellow-200 dark:via-green-400 dark:via-blue-400 dark:to-violet-400"
                              : "font-medium text-gray-800 dark:text-gray-200"
                          }
                        >
                          {playerEnrolled.player.user?.display_name ||
                            playerEnrolled.player.guest?.name ||
                            "Unknown"}
                        </span>
                        {playerEnrolled.player.user?.id ===
                          "6b180f86-1c4f-437d-afa3-064654c18bb8" && (
                          <span className="ml-1">🌈</span>
                        )}
                        {playerEnrolled.team === "white" && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full dark:bg-gray-300 dark:text-gray-900">
                            White
                          </span>
                        )}
                        {playerEnrolled.team === "black" && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-white bg-gray-900 rounded-full dark:bg-black dark:text-gray-200">
                            Black
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400 italic">Empty Slot</span>
                    )}
                  </span>

                  {!isGameOver && canRemove && (
                    <Form method="post">
                      <input type="hidden" name="_action" value="unenroll" />
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
                  {!isGameOver && !playerEnrolled && (
                    <>
                      {/* Guest form (always rendered, hidden when not active) */}
                      <Form
                        method="post"
                        className={`flex gap-2 items-center transition-opacity duration-200 ${
                          guestInputSlot === position
                            ? "opacity-100 visible"
                            : "hidden opacity-0 invisible h-0 overflow-hidden"
                        }`}
                        onSubmit={() => setGuestName("")}
                      >
                        <input
                          type="hidden"
                          name="_action"
                          value="enrollGuest"
                        />
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
                              <input
                                type="hidden"
                                name="_action"
                                value="enroll"
                              />
                              <input
                                type="hidden"
                                name="position"
                                value={position}
                              />
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
    </main>
  );
}
