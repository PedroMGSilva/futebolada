import pool from "~/.server/db/client";
import type { User } from "~/.server/db/operations/users";
import type { Team } from "~/.server/db/operations/players-enrolled";

type Guest = { id: string; name: string; createdBy: string };
type Player = { id: string; user?: User; guest?: Guest };
type WinningTeam = "black" | "white" | "draw";
type PlayerEnrolled = {
  id: string;
  position: number;
  team: Team;
  player: Player;
  createdBy: string;
};
export type Game = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  latitude: number;
  longitude: number;
  location: string;
  maxPlayers: number;
  price: number;
  winningTeam?: WinningTeam | null;
  playersEnrolled: PlayerEnrolled[];
};

function parseGameRows(rows: any[]): Game[] {
  const gamesMap = new Map<string, Game>();

  for (const row of rows) {
    let game = gamesMap.get(row.game_id);
    if (!game) {
      game = {
        id: row.game_id,
        date: row.date,
        startTime: row.start_time,
        endTime: row.end_time,
        latitude: row.latitude,
        longitude: row.longitude,
        location: row.location,
        maxPlayers: row.max_players,
        price: row.price,
        winningTeam: row.winning_team,
        playersEnrolled: [],
      };
      gamesMap.set(row.game_id, game);
    }

    if (row.players_enrolled_id) {
      const player: Player = {
        id: row.player_id,
      };

      if (row.user_id) {
        player.user = {
          id: row.user_id,
          email: row.email,
          name: row.user_name,
          display_name: row.user_display_name,
          role: row.user_role,
        };
      } else if (row.guest_id) {
        player.guest = {
          id: row.guest_id,
          name: row.guest_name,
          createdBy: row.guest_created_by,
        };
      }

      game.playersEnrolled.push({
        id: row.players_enrolled_id,
        position: row.position,
        team: row.team,
        createdBy: row.players_enrolled_created_by,
        player,
      });
    }
  }

  return Array.from(gamesMap.values());
}

interface GetUpcomingGamesResponse {
  games: Game[];
}

export async function getUpcomingGames(): Promise<GetUpcomingGamesResponse> {
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().split(" ")[0];

  const res = await pool.query(
    `
    SELECT
      g.id as game_id,
      g.date,
      g.start_time,
      g.end_time,
      g.latitude,
      g.longitude,
      g.location,
      g.max_players,
      g.price,
      pe.id AS players_enrolled_id,
      pe.created_by AS players_enrolled_created_by,
      pe.position,
      pe.team,
      p.id AS player_id,
      u.id AS user_id,
      u.email,
      u.name as user_name,
      u.display_name as user_display_name,
      u.role as user_role,
      gu.id as guest_id,
      gu.name as guest_name,
      gu.created_by as guest_created_by
    FROM games g
    LEFT JOIN players_enrolled pe ON pe.game_id = g.id
    LEFT JOIN players p ON p.id = pe.player_id
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN guests gu ON gu.id = p.guest_id
    WHERE g.date > $1 OR (g.date = $1 AND g.end_time >= $2)
    ORDER BY g.date, g.start_time, pe.position
  `,
    [currentDate, currentTime],
  );

  const games = parseGameRows(res.rows);
  return { games };
}

interface GetPastGamesInput {
  limit: number;
  offset: number;
}

interface GetPastGamesResponse {
  games: Game[];
  total: number;
}

export async function getPastGames({
  limit,
  offset,
}: GetPastGamesInput): Promise<GetPastGamesResponse> {
  const now = new Date();

  // Local date and time
  const currentDate = now.toISOString().slice(0, 10);
  const currentTime = now.toTimeString().slice(0, 8);

  // Using a transaction to ensure both queries are consistent
  const client = await pool.connect();
  try {
    // First, get the total count of past games
    const totalRes = await client.query<{ total: string }>(
      `
      SELECT COUNT(id) as total
      FROM games
      WHERE date < $1 OR (date = $1 AND end_time < $2)
    `,
      [currentDate, currentTime],
    );
    const total = parseInt(totalRes.rows[0].total, 10);

    // Then, fetch the paginated list of games with all their details
    const gamesRes = await client.query(
      `
      SELECT
        g.id as game_id, g.date, g.start_time, g.end_time, g.latitude, g.longitude,
        g.location, g.max_players, g.price, g.winning_team,
        pe.id AS players_enrolled_id, pe.created_by AS players_enrolled_created_by,
        pe.position, pe.team,
        p.id AS player_id,
        u.id AS user_id, u.email, u.name as user_name, u.display_name as user_display_name, u.role as user_role,
        gu.id as guest_id, gu.name as guest_name, gu.created_by as guest_created_by
      FROM games g
      LEFT JOIN players_enrolled pe ON pe.game_id = g.id
      LEFT JOIN players p ON p.id = pe.player_id
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN guests gu ON gu.id = p.guest_id
      WHERE g.id IN (
        SELECT id FROM games
        WHERE date < $1 OR (date = $1 AND end_time < $2)
        ORDER BY date DESC, start_time DESC
        LIMIT $3 OFFSET $4
      )
      ORDER BY g.date DESC, g.start_time DESC, pe.position
    `,
      [currentDate, currentTime, limit, offset],
    );

    const games = parseGameRows(gamesRes.rows);

    return { games, total };
  } finally {
    client.release();
  }
}

export async function getGameById(gameId: string): Promise<Game | null> {
  const res = await pool.query(
    `
    SELECT
      g.id as game_id,
      g.date,
      g.start_time,
      g.end_time,
      g.latitude,
      g.longitude,
      g.location,
      g.max_players,
      g.price,
      g.winning_team,
      pe.id AS players_enrolled_id,
      pe.created_by AS players_enrolled_created_by,
      pe.position,
      pe.team,
      p.id AS player_id,
      u.id AS user_id,
      u.email,
      u.name as user_name,
      u.display_name as user_display_name,
      u.role as user_role,
      gu.id as guest_id,
      gu.name as guest_name,
      gu.created_by as guest_created_by
    FROM games g
    LEFT JOIN players_enrolled pe ON pe.game_id = g.id
    LEFT JOIN players p ON p.id = pe.player_id
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN guests gu ON gu.id = p.guest_id
    WHERE g.id = $1
    ORDER BY pe.position
    `,
    [gameId],
  );

  const games = parseGameRows(res.rows);
  return games.length > 0 ? games[0] : null;
}

interface CreateGameInput {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  latitude: number;
  longitude: number;
  location: string;
  maxPlayers: number;
  price: number;
  createdBy: string;
  updatedBy: string;
}

export async function createGame(input: CreateGameInput): Promise<Game> {
  const result = await pool.query<Game>(
    `
    INSERT INTO games (id, date, start_time, end_time, latitude, longitude, location, max_players, price, created_at, created_by, updated_at, updated_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, NOW(), $11)
    RETURNING id, date, start_time as "startTime", end_time as "endTime", latitude, longitude, location, max_players as "maxPlayers", price, winning_team as "winningTeam"
  `,
    [
      input.id,
      input.date,
      input.startTime,
      input.endTime,
      input.latitude,
      input.longitude,
      input.location,
      input.maxPlayers,
      input.price,
      input.createdBy,
      input.updatedBy,
    ],
  );

  return result.rows[0];
}

type EnrollInGameInput = {
  playerEnrolledId: string;
  gameId: string;
  playerId: string;
  position: number;
  actorId: string; // whoever is performing the action (e.g. userId)
};

export async function enrollInGame(input: EnrollInGameInput): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Check if position is already taken
    const { rowCount: slotTaken } = await client.query(
      `
      SELECT 1 FROM players_enrolled
      WHERE game_id = $1 AND position = $2
      `,
      [input.gameId, input.position],
    );

    if (slotTaken !== null && slotTaken > 0) {
      throw new Error("That position is already taken");
    }

    // 2. Check if the player is already enrolled in this game
    const { rowCount: alreadyEnrolled } = await client.query(
      `
      SELECT 1 FROM players_enrolled
      WHERE game_id = $1 AND player_id = $2
      `,
      [input.gameId, input.playerId],
    );

    if (alreadyEnrolled !== null && alreadyEnrolled > 0) {
      throw new Error("This player is already enrolled in this game");
    }

    // 3. Insert enrollment
    await client.query(
      `
      INSERT INTO players_enrolled (id, player_id, game_id, position, created_at, created_by, updated_at, updated_by)
      VALUES ($1, $2, $3, $4, NOW(), $5, NOW(), $6)
      `,
      [
        input.playerEnrolledId,
        input.playerId,
        input.gameId,
        input.position,
        input.actorId,
        input.actorId,
      ],
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

interface UnenrollFromGameInput {
  gameId: string;
  playerId: string;
}

export async function unenrollFromGame(
  input: UnenrollFromGameInput,
): Promise<void> {
  await pool.query(
    `DELETE FROM players_enrolled WHERE game_id = $1 AND player_id = $2`,
    [input.gameId, input.playerId],
  );
}

interface SetWinningTeamInput {
  gameId: string;
  winningTeam: WinningTeam;
  actorId: string;
}

export async function setWinningTeam(
  input: SetWinningTeamInput,
): Promise<void> {
  await pool.query(
    `
    UPDATE games
    SET winning_team = $1, updated_at = NOW(), updated_by = $2
    WHERE id = $3
  `,
    [input.winningTeam, input.actorId, input.gameId],
  );
}
