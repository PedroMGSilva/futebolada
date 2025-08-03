import pool from "~/.server/db/client";
import type {Player} from "~/.server/db/operations/players";

type User = {
  id: string;
  email: string;
  name: string;
  password: string;
};

export async function getUser(email: string): Promise<User | null> {
  const result = await pool.query<User>(
    `
      SELECT
          u.id,
          u.email,
          u.name,
          u.password
      FROM users u
      WHERE u.email = $1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

interface CreateUserAndPlayerInput {
  userId: string;
  playerId: string;
  email: string;
  name: string;
  password: string;
}

interface CreateUserAndPlayerOutput {
  user: User;
  player: Player;
}

export async function createUserAndPlayer(input: CreateUserAndPlayerInput): Promise<CreateUserAndPlayerOutput> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if user exists
    const { rowCount } = await client.query(
      'SELECT 1 FROM users WHERE email = $1',
      [input.email]
    );

    if (rowCount != null && rowCount > 0) {
      await client.query('ROLLBACK');
      throw new Response('User already exists', { status: 404 });
    }

    const user = await client.query(`
      INSERT INTO users (id, email, name, password, created_at, created_by, updated_at, updated_by)
      VALUES ($1, $2, $3, $4, NOW(), $5, NOW(), $6)
      RETURNING id, email, name
    `, [input.userId, input.email, input.name, input.password, null, null]);

    const player = await client.query(`
      INSERT INTO players (id, user_id, created_at, created_by, updated_at, updated_by)
      VALUES ($1, $2, NOW(), $3, NOW(), $4)
      RETURNING id, user_id, guest_id
    `, [input.playerId, input.userId, input.userId, input.userId]);

    await client.query('COMMIT');

    return {
      user: user.rows[0],
      player: player.rows[0],
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}