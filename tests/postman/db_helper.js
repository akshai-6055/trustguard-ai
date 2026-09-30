const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '2004',
    database: 'trustguard_ai',
    port: 3306
});

app.post('/query', async (req, res) => {
    try {
        const { query, params } = req.body;
        const [result] = await pool.query(query, params || []);
        res.json({ success: true, result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(5001, () => console.log('Helper DB API running on 5001'));
