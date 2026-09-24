require('dotenv').config({ path: __dirname + '/../.env' });
const db = require("../config/db");

async function run() {
    try {
        const [devices] = await db.query("DESCRIBE devices");
        console.log("Devices Schema:", devices);

        const [policies] = await db.query("DESCRIBE security_policies");
        console.log("Policies Schema:", policies);
        
        const [users] = await db.query("DESCRIBE users");
        console.log("Users Schema:", users);
    } catch (err) {
        console.error("DB error:", err);
    } finally {
        process.exit(0);
    }
}
run();
