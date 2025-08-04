export const shorthands = undefined;

export const up = (pgm) => {
  // Create the ENUM type for roles
  pgm.createType("user_role", ["admin", "user"]);

  // Create the users table
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
    },
    email: {
      type: "text",
      notNull: true,
      unique: true,
    },
    name: {
      type: "text",
      notNull: true,
    },
    password: {
      type: "text",
      notNull: true,
    },
    role: {
      type: "user_role",
      notNull: true,
      default: "user", // set default role
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

export const down = (pgm) => {
  pgm.dropTable("users");
  pgm.dropType("user_role");
};
