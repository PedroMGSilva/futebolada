import { existsSync } from "node:fs";
import { createCanvas, GlobalFonts, type SKRSContext2D } from "@napi-rs/canvas";
import type { Game } from "~/.server/db/operations/games";
import { formatDate } from "~/utils";

const WIDTH = 1080;
const MARGIN = 48;
const GAP = 32;
const CARD_WIDTH = (WIDTH - MARGIN * 2 - GAP) / 2;
const CARD_RADIUS = 26;
const CARD_PAD = 28;
const BAND_HEIGHT = 96;
const PILL_HEIGHT = 88;
const PILL_GAP = 16;
const PILL_RADIUS = 14;
const HEADER_TEXT_BOTTOM = 256;
const HEADER_PAD_BOTTOM = 56;
const HEADER_BAND_HEIGHT = HEADER_TEXT_BOTTOM + HEADER_PAD_BOTTOM;
const HEADER_HEIGHT = HEADER_BAND_HEIGHT + MARGIN;
const FOOTER_PAD = 34;
const FOOTER_LINE_HEIGHT = 40;
const NAME_SIZE = 40;
const NAME_MIN_SIZE = 24;

const PAGE = "#e8ecf1";
const NAVY = "#16294d";
const NAVY_SOFT = "#9db4d8";

const LIGHT_CARD = "#ffffff";
const LIGHT_BAND = "#94a3b8";
const LIGHT_PILL = "#f1f5f9";
const ON_LIGHT = "#1e293b";

const DARK_CARD = "#111827";
const DARK_BAND = "#334155";
const DARK_PILL = "#1f2937";
const ON_DARK = "#f8fafc";

const EMOJI =
  /\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|️|‍/gu;

type Palette = {
  card: string;
  band: string;
  pill: string;
  ink: string;
  bandInk: string;
};

const BRANCOS: Palette = {
  card: LIGHT_CARD,
  band: LIGHT_BAND,
  pill: LIGHT_PILL,
  ink: ON_LIGHT,
  bandInk: "#ffffff",
};

const PRETOS: Palette = {
  card: DARK_CARD,
  band: DARK_BAND,
  pill: DARK_PILL,
  ink: ON_DARK,
  bandInk: "#ffffff",
};

let fontsReady = false;

function registerFonts() {
  if (fontsReady) return;

  for (const [file, family] of [
    ["Inter-Regular.ttf", "Inter"],
    ["Inter-Bold.ttf", "InterBold"],
  ]) {
    const candidates = [`build/client/fonts/${file}`, `public/fonts/${file}`];
    const found = candidates.find((path) => existsSync(path));
    if (found) GlobalFonts.registerFromPath(found, family);
  }

  fontsReady = true;
}

function label(playerEnrolled: Game["playersEnrolled"][number]): string {
  const name =
    playerEnrolled.player.user?.display_name ||
    playerEnrolled.player.guest?.name ||
    "?";

  return name.replace(EMOJI, "").replace(/\s+/g, " ").trim() || "?";
}

function roster(game: Game, team: "black" | "white"): string[] {
  return game.playersEnrolled.filter((pe) => pe.team === team).map(label);
}

const PARTICLES = new Set(["de", "da", "do", "das", "dos", "e"]);

/**
 * Progressively shorter renderings of a name, longest first:
 * "Nuno Goncalves da Silva Pereira" -> "Nuno G. da S. Pereira" -> "Nuno Pereira"
 */
function variants(name: string): string[] {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length <= 2) return [name];

  const first = parts[0];
  const last = parts[parts.length - 1];
  const middle = parts
    .slice(1, -1)
    .map((word) =>
      PARTICLES.has(word.toLowerCase()) ? word : `${word[0].toUpperCase()}.`,
    );

  return [name, [first, ...middle, last].join(" "), `${first} ${last}`];
}

function wrapNames(
  ctx: SKRSContext2D,
  prefix: string,
  names: string[],
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let current = prefix;

  for (const [index, name] of names.entries()) {
    const separator = index < names.length - 1 ? "," : "";
    const candidate = `${current}${current === prefix ? " " : " "}${name}${separator}`;

    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = `${name}${separator}`;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function roundRect(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function ellipsize(ctx: SKRSContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let candidate = text;
  while (
    candidate.length > 1 &&
    ctx.measureText(`${candidate}…`).width > maxWidth
  ) {
    candidate = candidate.slice(0, -1);
  }

  return `${candidate}…`;
}

function drawCard(
  ctx: SKRSContext2D,
  names: string[],
  title: string,
  palette: Palette,
  x: number,
  y: number,
  height: number,
) {
  roundRect(ctx, x, y, CARD_WIDTH, height, CARD_RADIUS);
  ctx.fillStyle = palette.card;
  ctx.fill();

  ctx.save();
  roundRect(ctx, x, y, CARD_WIDTH, height, CARD_RADIUS);
  ctx.clip();
  ctx.fillStyle = palette.band;
  ctx.fillRect(x, y, CARD_WIDTH, BAND_HEIGHT);
  ctx.restore();

  ctx.fillStyle = palette.bandInk;
  ctx.font = "38px InterBold";
  ctx.textBaseline = "middle";
  ctx.fillText(title, x + CARD_PAD, y + BAND_HEIGHT / 2);

  const pillWidth = CARD_WIDTH - CARD_PAD * 2;
  const maxText = pillWidth - 44 - 24;

  names.forEach((name, index) => {
    const pillY = y + BAND_HEIGHT + CARD_PAD + index * (PILL_HEIGHT + PILL_GAP);

    roundRect(ctx, x + CARD_PAD, pillY, pillWidth, PILL_HEIGHT, PILL_RADIUS);
    ctx.fillStyle = palette.pill;
    ctx.fill();

    const centre = pillY + PILL_HEIGHT / 2;

    ctx.fillStyle = palette.ink;
    ctx.globalAlpha = 0.4;
    ctx.font = "24px Inter";
    ctx.fillText(`${index + 1}`, x + CARD_PAD + 20, centre);
    ctx.globalAlpha = 1;

    const options = variants(name);
    let text = options[options.length - 1];
    let size = NAME_MIN_SIZE;

    // Keep as much of the name as will fit, shrinking before dropping words.
    outer: for (const option of options) {
      for (
        let candidate = NAME_SIZE;
        candidate >= NAME_MIN_SIZE;
        candidate -= 2
      ) {
        ctx.font = `${candidate}px InterBold`;
        if (ctx.measureText(option).width <= maxText) {
          text = option;
          size = candidate;
          break outer;
        }
      }
    }

    ctx.font = `${size}px InterBold`;
    ctx.fillText(ellipsize(ctx, text, maxText), x + CARD_PAD + 64, centre);
  });

  ctx.textBaseline = "alphabetic";
}

export function renderTeamsImage(game: Game): Buffer | null {
  registerFonts();

  const black = roster(game, "black");
  const white = roster(game, "white");
  if (black.length === 0 && white.length === 0) return null;

  const unassigned = game.playersEnrolled.filter((pe) => !pe.team).map(label);
  const rows = Math.max(black.length, white.length);

  // Measure first: the footer grows with however many lines the names need.
  const measuring = createCanvas(1, 1).getContext("2d");
  measuring.font = "28px Inter";
  const footerLines =
    unassigned.length > 0
      ? wrapNames(measuring, "Sem equipa:", unassigned, WIDTH - MARGIN * 2)
      : [];
  const footer =
    footerLines.length > 0
      ? FOOTER_PAD * 2 + footerLines.length * FOOTER_LINE_HEIGHT
      : 0;

  const cardHeight =
    BAND_HEIGHT +
    CARD_PAD * 2 +
    rows * PILL_HEIGHT +
    Math.max(0, rows - 1) * PILL_GAP;
  const height = HEADER_HEIGHT + cardHeight + MARGIN + footer;

  const canvas = createCanvas(WIDTH, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = PAGE;
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, WIDTH, HEADER_BAND_HEIGHT);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = NAVY_SOFT;
  ctx.font = "26px InterBold";
  ctx.fillText("FUTEBOLADA", MARGIN, 76);

  ctx.fillStyle = "#ffffff";
  ctx.font = "72px InterBold";
  ctx.fillText("Equipas", MARGIN, 162);

  ctx.fillStyle = NAVY_SOFT;
  ctx.font = "30px Inter";
  ctx.fillText(
    ellipsize(
      ctx,
      `${formatDate(game.date)}  ·  ${game.startTime.slice(0, 5)}–${game.endTime.slice(0, 5)}`,
      WIDTH - MARGIN * 2,
    ),
    MARGIN,
    214,
  );
  ctx.fillText(
    ellipsize(ctx, game.location, WIDTH - MARGIN * 2),
    MARGIN,
    HEADER_TEXT_BOTTOM,
  );

  drawCard(ctx, white, "BRANCOS", BRANCOS, MARGIN, HEADER_HEIGHT, cardHeight);
  drawCard(
    ctx,
    black,
    "PRETOS",
    PRETOS,
    MARGIN + CARD_WIDTH + GAP,
    HEADER_HEIGHT,
    cardHeight,
  );

  if (footerLines.length > 0) {
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, height - footer, WIDTH, footer);
    ctx.fillStyle = NAVY_SOFT;
    ctx.font = "28px Inter";

    footerLines.forEach((line, index) => {
      ctx.fillText(
        line,
        MARGIN,
        height - footer + FOOTER_PAD + 28 + index * FOOTER_LINE_HEIGHT,
      );
    });
  }

  return canvas.toBuffer("image/jpeg", 92);
}
