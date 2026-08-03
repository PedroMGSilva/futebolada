import type { Game } from "~/.server/db/operations/games";
import { formatDate } from "~/utils";

const COLUMN_WIDTH = 12;

function playerLabel(playerEnrolled: Game["playersEnrolled"][number]): string {
  return (
    playerEnrolled.player.user?.display_name ||
    playerEnrolled.player.guest?.name ||
    "?"
  );
}

function fit(name: string): string {
  return name.length <= COLUMN_WIDTH
    ? name
    : `${name.slice(0, COLUMN_WIDTH - 1)}…`;
}

export function formatTeamsMessage(game: Game): string | null {
  const named = (team: "black" | "white") =>
    game.playersEnrolled.filter((pe) => pe.team === team).map(playerLabel);

  const black = named("black");
  const white = named("white");

  if (black.length === 0 && white.length === 0) return null;

  const rows = Math.max(black.length, white.length);
  const table = Array.from({ length: rows }, (_, i) =>
    `${fit(black[i] ?? "").padEnd(COLUMN_WIDTH)}  ${fit(white[i] ?? "")}`.trimEnd(),
  );

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

  lines.push(
    "",
    "```",
    `${"PRETOS".padEnd(COLUMN_WIDTH)}  BRANCOS`,
    "-".repeat(COLUMN_WIDTH * 2 + 2),
    ...table,
    "```",
  );

  const unassigned = game.playersEnrolled.filter((pe) => !pe.team);
  if (unassigned.length > 0) {
    lines.push("", `_Sem equipa: ${unassigned.map(playerLabel).join(", ")}_`);
  }

  return lines.join("\n");
}
