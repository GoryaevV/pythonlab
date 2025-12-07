// backend/simple-server.js
const express = require('express');
const app = express();
const path = require('path');

const PORT = 3000;

// Просто раздаем статику
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Все маршруты ведут на index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Простой сервер работает: http://localhost:${PORT}`);
});