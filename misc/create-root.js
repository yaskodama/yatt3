// One-off script to create a root/root account in the login-testing DB.
// Usage: node misc/create-root.js
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const moment = require('moment');

const db = mongoose.createConnection('mongodb://127.0.0.1/login-testing');

const accountsSchema = new mongoose.Schema({
    name:    { type: String, required: true },
    email:   { type: String, required: true },
    user:    { type: String, required: true },
    pass:    { type: String, required: true },
    country: { type: String, required: true },
    date:    { type: String, required: true },
});

const Accounts = db.model('Accounts', accountsSchema);

(async () => {
    try {
        const existing = await Accounts.findOne({ user: 'root' });
        const hash = await bcrypt.hash('root', 10);
        const now = moment().format('MMMM Do YYYY, h:mm:ss a');

        if (existing) {
            existing.pass = hash;
            existing.name = existing.name || 'root';
            existing.email = existing.email || 'root@example.com';
            existing.country = existing.country || 'JP';
            existing.date = now;
            await existing.save();
            console.log('[OK] Updated existing root user (password reset to "root").');
        } else {
            await Accounts.create({
                name: 'root',
                email: 'root@example.com',
                user: 'root',
                pass: hash,
                country: 'JP',
                date: now,
            });
            console.log('[OK] Created root user (user=root, pass=root).');
        }
    } catch (e) {
        console.error('[ERROR]', e);
        process.exitCode = 1;
    } finally {
        await db.close();
    }
})();
