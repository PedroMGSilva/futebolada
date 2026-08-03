import type { Game } from "~/.server/db/operations/games";
import { formatDate } from "~/utils";

type PlayerEnrolled = Game["playersEnrolled"][number];

function playerLabel(playerEnrolled: PlayerEnrolled): string {
  return (
    playerEnrolled.player.user?.display_name ||
    playerEnrolled.player.guest?.name ||
    "?"
  );
}

function roster(game: Game, team: "black" | "white"): string[] {
  return game.playersEnrolled
    .filter((playerEnrolled) => playerEnrolled.team === team)
    .map(playerLabel);
}

export function formatTeamsMessage(game: Game): string | null {
  const black = roster(game, "black");
  const white = roster(game, "white");

  if (black.length === 0 && white.length === 0) return null;

  const lines = [
    "⚽ *Equipas*",
    "",
    `*Jogo*: ${formatDate(game.date)}`,
    `*Hora*: ${game.startTime.slice(0, 5)} - ${game.endTime.slice(0, 5)}`,
    `*Local*: ${game.location}`,
  ];

  if (game.latitude !== 0 || game.longitude !== 0) {
    lines.push(
      `*Como chegar*: https://www.google.com/maps/dir/?api=1&destination=${game.latitude},${game.longitude}`,
    );
  }

  for (const [label, names] of [
    ["⚪ *BRANCOS*", white],
    ["⚫ *PRETOS*", black],
  ] as const) {
    lines.push("", label);
    lines.push(
      ...(names.length > 0 ? names.map((n) => `• ${n}`) : ["_(vazio)_"]),
    );
  }

  const unassigned = game.playersEnrolled
    .filter((playerEnrolled) => !playerEnrolled.team)
    .map(playerLabel);

  if (unassigned.length > 0) {
    lines.push("", `_Sem equipa: ${unassigned.join(", ")}_`);
  }

  return lines.join("\n");
}
