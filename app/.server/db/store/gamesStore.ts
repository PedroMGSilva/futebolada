import pool from "~/.server/db/client";
import { v4 as uuidv4 } from 'uuid';
import type {User} from "~/.server/domain/auth";

export type Game = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
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
      g.location,
      g.max_players AS "maxPlayers",
      g.created_at,
      g.updated_at,
      COALESCE(
        json_agg(
          jsonb_build_object(
            'id', u.id,
            'username', u.username
          )
          ORDER BY u.username
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
      g.location,
      g.max_players AS "maxPlayers",
      g.created_at,
      g.updated_at,
      COALESCE(
        json_agg(
          jsonb_build_object(
            'id', u.id,
            'username', u.username
          )
          ORDER BY u.username
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
                                   location,
                                   maxPlayers,
                                 }: {
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxPlayers: number;
}): Promise<Game> {
  const id = uuidv4();

  const result = await pool.query<Game>(
    `
    INSERT INTO games (id, date, start_time, end_time, location, max_players)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, date, start_time as "startTime", end_time as "endTime", location, max_players as "maxPlayers"
  `,
    [id, date, startTime, endTime, location, maxPlayers]
  );

  return result.rows[0];
}

interface enrollInGameProps {
  gameId: string,
  userId: string,
}
export async function enrollInGame(props: enrollInGameProps): Promise<void> {
  const id = uuidv4();

  await pool.query<Game>(
    `
    INSERT INTO game_players (id, game_id, user_id)
    VALUES ($1, $2, $3)
    RETURNING id, game_id as "gameId", user_id as "userId", team
  `,
    [id, props.gameId, props.userId]
  );
}