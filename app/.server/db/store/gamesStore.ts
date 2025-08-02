import pool from "~/.server/db/client";
import { v4 as uuidv4 } from 'uuid';
import type {User} from "~/.server/domain/auth";

export type Game = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  latitude: number;
  longitude: number;
  location: string;
  maxPlayers: number;
  enrolledPlayers: User[];
};

export async function getAllGames(): Promise<Game[]> {
  const result = await pool.query<Game>(`
    SELECT
      g.id,
      to_char(g.date, 'YYYY-MM-DD') AS date,
      g.start_time AS "startTime",
      g.end_time AS "endTime",
      g.latitude,
      g.longitude,
      g.location,
      g.max_players AS "maxPlayers",
      g.created_at,
      g.updated_at,
      COALESCE(
        json_agg(
          jsonb_build_object(
            'id', u.id,
            'email', u.email,
            'name', u.name
          )
          ORDER BY u.email
        ) FILTER (WHERE u.id IS NOT NULL),
        '[]'
      ) AS "enrolledPlayers"
    FROM games g
    LEFT JOIN game_players gp ON g.id = gp.game_id
    LEFT JOIN users u ON gp.user_id = u.id
    WHERE g.date >= CURRENT_DATE
    GROUP BY g.id
    ORDER BY g.date ASC
  `);

  return result.rows;
}

export async function getGame(id: String): Promise<Game> {
  const result = await pool.query<Game>(`
    SELECT
      g.id,
      to_char(g.date, 'YYYY-MM-DD') AS date,
      g.start_time AS "startTime",
      g.end_time AS "endTime",
      g.latitude,
      g.longitude,
      g.location,
      g.max_players AS "maxPlayers",
      g.created_at,
      g.updated_at,
      COALESCE(
        json_agg(
          jsonb_build_object(
            'id', u.id,
            'email', u.email,
            'name', u.name
          )
          ORDER BY u.email
        ) FILTER (WHERE u.id IS NOT NULL),
        '[]'
      ) AS "enrolledPlayers"
    FROM games g
    LEFT JOIN game_players gp ON g.id = gp.game_id
    LEFT JOIN users u ON gp.user_id = u.id
    WHERE g.id = $1
    GROUP BY g.id
  `, [id]);

  const game = result.rows[0];
  if (!game) throw new Response("Game not found", { status: 404 });

  return game;
}

export async function createGame({
  date,
                                   startTime,
  endTime,
                                   latitude,
  longitude,
  location,
                                   maxPlayers,
                                 }: {
  date: string;
  startTime: string;
  endTime: string;
  latitude: number;
  longitude: number;
  location: string;
  maxPlayers: number;
}): Promise<Game> {
  const id = uuidv4();

  const result = await pool.query<Game>(
    `
    INSERT INTO games (id, date, start_time, end_time, latitude, longitude, location, max_players)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, date, start_time as "startTime", end_time as "endTime", latitude, longitude, location, max_players as "maxPlayers"
  `,
    [id, date, startTime, endTime, latitude, longitude, location, maxPlayers]
  );

  return result.rows[0];
}

interface enrollInGameInput {
  gameId: string,
  userId: string,
}

export async function enrollInGame(input: enrollInGameInput): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get maxPlayers and current count
    const { rows: [game] } = await client.query(
      `
      SELECT max_players AS "maxPlayers"
      FROM games
      WHERE id = $1
      `,
      [input.gameId]
    );

    if (!game) {
      throw new Error("Game not found");
    }

    const { rows: [count] } = await client.query(
      `
      SELECT COUNT(*)::int AS "enrolledCount"
      FROM game_players
      WHERE game_id = $1
      `,
      [input.gameId]
    );

    if (count.enrolledCount >= game.maxPlayers) {
      throw new Error("Game is full");
    }

    const id = uuidv4();
    await client.query(
      `
      INSERT INTO game_players (id, game_id, user_id)
      VALUES ($1, $2, $3)
      `,
      [id, input.gameId, input.userId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

interface unenrollFromGameInput {
  gameId: string,
  userId: string,
}

export async function unenrollFromGame(input: unenrollFromGameInput): Promise<void> {
  await pool.query(
    `
    DELETE FROM game_players
    WHERE game_id = $1 AND user_id = $2
  `,
    [input.gameId, input.userId]
  );
}

