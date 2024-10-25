// Файл: server.js
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Обработка запросов к базе знаний
app.post('/api/get-response', async (req, res) => {
    const { query } = req.body;

    // Здесь можно сделать запрос к GPT или к базе данных для генерации ответа
    // Временно возвращаем заглушку
    const answer = `Ответ на запрос: ${query}`;
    res.json({ answer });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});

