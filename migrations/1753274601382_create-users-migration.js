export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createType("user_role", ["admin", "user"]);
  pgm.createType("user_auth_provider", ["local", "google", "facebook"]);

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
    },
    role: {
      type: "user_role",
      notNull: true,
      default: "user",
    },
    auth_provider: {
      type: "user_auth_provider",
      notNull: true,
      default: "local",
    },
    auth_provider_id: {
      type: "text",
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

  pgm.addConstraint("users", "unique_auth_provider_and_id", {
    unique: ["auth_provider", "auth_provider_id"],
  });
};

export const down = (pgm) => {
  pgm.dropTable("users");
  pgm.dropType("user_role");
  pgm.dropType("user_auth_provider");
};
