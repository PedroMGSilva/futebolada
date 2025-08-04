import pool from "~/.server/db/client";

type Guest = {
  id: string;
  name: string;
};

export async function getAllGuests(): Promise<Guest[]> {
  const result = await pool.query<Guest>(
    `SELECT id, name FROM guests ORDER BY name ASC LIMIT 1000`,
  );

  return result.rows;
}

interface FindByNameInput {
  name: string;
}
export async function findGuestByName(
  input: FindByNameInput,
): Promise<Guest | null> {
  const result = await pool.query<Guest>(
    `SELECT id, name FROM guests WHERE name = $1 LIMIT 1`,
    [input.name],
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

interface CreateGuestInput {
  guestId: string;
  playerId: string;
  name: string;
  actorId: string; // whoever is performing the action (e.g. userId)
}

export async function createGuestAndPlayer(
  input: CreateGuestInput,
): Promise<Guest> {
  await pool.query<Guest>(
    `
    INSERT INTO guests (id, name, created_at, created_by, updated_at, updated_by)
    VALUES ($1, $2, NOW(), $3, NOW(), $4)
    `,
    [input.guestId, input.name, input.actorId, input.actorId],
  );

  await pool.query(
    `
      INSERT INTO players (id, guest_id, created_at, created_by, updated_at, updated_by)
      VALUES ($1, $2, NOW(), $3, NOW(), $4)
      RETURNING id, user_id, guest_id
    `,
    [input.playerId, input.guestId, input.actorId, input.actorId],
  );

  return { id: input.guestId, name: input.name };
}
