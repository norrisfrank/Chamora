const db = require('../src/config/db');

async function migrate() {
    try {
        console.log('Running migration: adding indexes to users and logs...');
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
            CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);
            CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
        `);
        console.log('Indexing completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Indexing failed:', error);
        process.exit(1);
    }
}

migrate();
