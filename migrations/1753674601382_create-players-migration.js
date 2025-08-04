export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable("players", {
    id: {
      type: "uuid",
      primaryKey: true,
    },
    user_id: {
      type: "uuid",
      references: "users",
      unique: true,
      onDelete: "CASCADE",
    },
    guest_id: {
      type: "uuid",
      references: "guests",
      unique: true,
      onDelete: "CASCADE",
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    created_by: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL",
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_by: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL",
    },
  });

  pgm.addConstraint("players", "players_user_or_guest_check", {
    check: `(user_id IS NOT NULL AND guest_id IS NULL) OR
        (user_id IS NULL AND guest_id IS NOT NULL)`,
  });
};

export async function down(pgm) {
  pgm.dropTable("players");
}
