export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable("guests", {
    id: {
      type: "uuid",
      primaryKey: true,
    },
    name: {
      type: "text",
      notNull: true,
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
};

export async function down(pgm) {
  pgm.dropTable("guests");
}
