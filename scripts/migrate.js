const db = require('../src/config/db');

async function migrate() {
    try {
        console.log('Running migration: ensuring core columns and tables...');
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'starter';
        `);
        await db.query(`
            ALTER TABLE groups
            ADD COLUMN IF NOT EXISTS group_code VARCHAR(6);
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS group_members (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                group_id INTEGER REFERENCES groups(id),
                role VARCHAR(50) DEFAULT 'member',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (user_id, group_id)
            );
        `);
        await db.query(`
            ALTER TABLE contributions
            ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20),
            ADD COLUMN IF NOT EXISTS mpesa_receipt_number VARCHAR(50),
            ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
        `);
        await db.query(`
            ALTER TABLE loans
            ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES groups(id);
        `);
        await db.query(`
            ALTER TABLE meetings
            ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES groups(id);
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS mpesa_transactions (
                id SERIAL PRIMARY KEY,
                contribution_id INTEGER REFERENCES contributions(id),
                checkout_request_id VARCHAR(100),
                merchant_request_id VARCHAR(100),
                phone_number VARCHAR(20),
                amount DECIMAL(15, 2),
                status VARCHAR(20) DEFAULT 'pending',
                mpesa_receipt_number VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                actor_id INTEGER REFERENCES users(id),
                action VARCHAR(100) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id INTEGER,
                metadata JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await db.query(`
            UPDATE groups
            SET group_code = LPAD((100000 + id)::text, 6, '0')
            WHERE group_code IS NULL;
        `);
        await db.query(`
            UPDATE contributions
            SET group_id = 1
            WHERE group_id IS NULL;
        `);
        await db.query(`
            UPDATE loans
            SET group_id = 1
            WHERE group_id IS NULL;
        `);
        await db.query(`
            UPDATE meetings
            SET group_id = 1
            WHERE group_id IS NULL;
        `);
        await db.query(`
            INSERT INTO group_members (user_id, group_id, role)
            SELECT u.id, 1, 'member'
            FROM users u
            WHERE NOT EXISTS (
                SELECT 1 FROM group_members gm WHERE gm.user_id = u.id AND gm.group_id = 1
            );
        `);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
