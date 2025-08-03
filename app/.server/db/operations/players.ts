import pool from "~/.server/db/client";

type PlayerBase = {
  id: string;
};

export type Player =
  | (PlayerBase & { userId: string; guestId?: never })
  | (PlayerBase & { guestId: string; userId?: never });

export async function getByUserId(userId: string): Promise<Player | null> {
  const res = await pool.query(
    `SELECT id FROM players WHERE user_id = $1 LIMIT 1`,
    [userId]
  );

  if (res.rowCount === 0) return null;
  return { id: res.rows[0].id, userId: userId };
}

export async function getByGuestId(guestId: string): Promise<Player | null> {
  const res = await pool.query(
    `SELECT id FROM players WHERE guest_id = $1 LIMIT 1`,
    [guestId]
  );

  if (res.rowCount === 0) return null;
  return { id: res.rows[0].id, guestId: guestId };
}
