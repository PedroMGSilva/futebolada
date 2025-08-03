export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable("players_enrolled", {
    id: {
      type: "uuid",
      primaryKey: true,
    },
    game_id: {
      type: "uuid",
      references: "games(id)",
      onDelete: "CASCADE",
      notNull: true,
    },
    player_id: {
      type: "uuid",
      references: "players(id)",
      onDelete: "CASCADE",
      notNull: true,
    },
    position: {
      type: "integer",
      notNull: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    created_by: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'SET NULL'
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_by: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'SET NULL'
    },
  });
  pgm.createIndex("players_enrolled", "game_id");
  pgm.createIndex("players_enrolled", "player_id");

  pgm.addConstraint("players_enrolled", "unique_game_user", {
    unique: ["game_id", "player_id"],
  });

  pgm.addConstraint("players_enrolled", "unique_game_position", {
    unique: ["game_id", "position"],
  });
};

export async function down(pgm) {
  pgm.dropTable("players_enrolled");
}
