const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function setupDatabase() {
    try {
        console.log('Reading schema.sql...');
        const schemaPath = path.join(__dirname, '../schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema...');
        await db.query(schema);

        console.log('Database setup completed successfully! 🎉');
        process.exit(0);
    } catch (error) {
        console.error('Database setup failed:', error);
        process.exit(1);
    }
}

setupDatabase();
