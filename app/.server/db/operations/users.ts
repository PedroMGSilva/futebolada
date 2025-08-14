import pool from "~/.server/db/client";
import type { Player } from "~/.server/db/operations/players";

type AuthProvider = "google" | "local" | "facebook";

export type User = {
  id: string;
  email: string;
  name: string;
  display_name: string;
  role: "user" | "admin";
};

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query<User>(
    `
      SELECT
          u.id,
          u.email,
          u.name,
          u.display_name,
          u.role
      FROM users u
      WHERE u.email = $1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await pool.query<User>(
    `
      SELECT
          u.id,
          u.email,
          u.name,
          u.display_name,
          u.role
      FROM users u
      WHERE u.id = $1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function getUserByAuthProviderId(
  id: string,
  authProvider: AuthProvider,
): Promise<User | null> {
  const result = await pool.query<User>(
    `
      SELECT
          u.id,
          u.email,
          u.name,
          u.display_name,
          u.role
      FROM users u
      WHERE u.auth_provider_id = $1 AND u.auth_provider = $2
    `,
    [id, authProvider],
  );

  return result.rows[0] ?? null;
}

interface CreateUserAndPlayerInput {
  userId: string;
  playerId: string;
  email: string;
  name: string;
  displayName: string;
  authProvider: AuthProvider;
  authProviderId: string | null;
}

interface CreateUserAndPlayerOutput {
  user: User;
  player: Player;
}

export async function createUserAndPlayer(
  input: CreateUserAndPlayerInput,
): Promise<CreateUserAndPlayerOutput> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check if user exists
    const { rowCount } = await client.query(
      "SELECT 1 FROM users WHERE email = $1",
      [input.email],
    );

    if (rowCount != null && rowCount > 0) {
      await client.query("ROLLBACK");
      throw new Response("User already exists", { status: 404 });
    }

    const user = await client.query(
      `
      INSERT INTO users (id, email, name, display_name, role, auth_provider, auth_provider_id, created_at, created_by, updated_at, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, NOW(), $9)
      RETURNING id, email, name, display_name
    `,
      [
        input.userId,
        input.email,
        input.name,
        input.displayName,
        "user",
        input.authProvider,
        input.authProviderId,
        null,
        null,
      ],
    );

    const player = await client.query(
      `
      INSERT INTO players (id, user_id, created_at, created_by, updated_at, updated_by)
      VALUES ($1, $2, NOW(), $3, NOW(), $4)
      RETURNING id, user_id, guest_id
    `,
      [input.playerId, input.userId, input.userId, input.userId],
    );

    await client.query("COMMIT");

    return {
      user: user.rows[0],
      player: player.rows[0],
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

interface UpdateUserDisplayNameInput {
  id: string;
  displayName: string;
  actorId: string;
}

export async function updateUserDisplayName(
  input: UpdateUserDisplayNameInput,
): Promise<User | null> {
  const result = await pool.query<User>(
    `
      UPDATE users
      SET display_name = $1, updated_at = NOW(), updated_by = $2
      WHERE id = $3
      RETURNING id, email, name, display_name, role
    `,
    [input.displayName, input.actorId, input.id],
  );

  return result.rows[0] ?? null;
}
