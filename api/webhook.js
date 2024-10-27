// webhook.js
import { Configuration, OpenAIApi } from 'openai';
import express from 'express';

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Пример базы знаний (можно расширить)
const knowledgeBase = [
    { question: "Westernpips Trade Monitor installation guide", answer: "Here's the installation guide for Westernpips Trade Monitor..." },
    // Добавьте больше вопросов и ответов
];

function getKnowledgeBaseAnswer(question) {
    const entry = knowledgeBase.find(item => item.question.toLowerCase() === question.toLowerCase());
    return entry ? entry.answer : null;
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { userMessage } = req.body;

        if (!userMessage) {
            console.error("Ошибка: 'userMessage' отсутствует в запросе.");
            return res.status(400).json({ success: false, error: "Поле 'userMessage' обязательно." });
        }

        try {
            // Ищем ответ в базе знаний
            let answer = getKnowledgeBaseAnswer(userMessage);

            // Если ответ не найден в базе знаний, обращаемся к OpenAI
            if (!answer) {
                console.log(`Вопрос не найден в базе знаний. Отправка запроса к GPT: ${userMessage}`);
                const gptResponse = await openai.createChatCompletion({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: userMessage }],
                });
                answer = gptResponse.data.choices[0].message.content;
            }

            // Ответ пользователю
            console.log(`Ответ через вебхук: ${answer}`);
            res.status(200).json({ success: true, answer, status: "👍 Webhook работает" });
        } catch (error) {
            console.error('Ошибка при обращении к OpenAI:', error.response?.data || error.message);
            res.status(500).json({ success: false, error: error.message, status: "👾 Webhook не работает. Лог ошибки: " + error.message });
        }
    } else {
        res.status(404).send('Not found');
    }
}
