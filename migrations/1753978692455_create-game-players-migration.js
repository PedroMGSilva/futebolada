export const shorthands = undefined;

export const up = (pgm) => {
    pgm.createTable('game_players', {
        id: {
            type: 'uuid',
            primaryKey: true,
        },
        game_id: {
            type: 'uuid',
            references: 'games(id)',
            onDelete: 'CASCADE',
            notNull: true,
        },
        user_id: {
            type: 'uuid',
            references: 'users(id)',
            onDelete: 'RESTRICT',
            notNull: true,
        },
        team: {
            type: 'integer',
            notNull: false,
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        updated_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
    pgm.createIndex('game_players', 'game_id');
    pgm.createIndex('game_players', 'user_id');
};

export async function down(pgm) {
    pgm.dropTable('game_players');
}
