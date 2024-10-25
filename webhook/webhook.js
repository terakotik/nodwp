// webhook.js
import { Configuration, OpenAIApi } from 'openai';
import { TelegramClient, Api } from 'telegram';
import express from 'express';

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async (req, res) => {
    if (req.method === 'POST') {
        const { userId, userMessage } = req.body;

        try {
            // Запрос к GPT для получения ответа
            const gptResponse = await openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: userMessage }],
            });

            const answer = gptResponse.data.choices[0].message.content;

            // Лог ответа
            console.log(`Ответ от GPT через вебхук: ${answer}`);

            // Ответ пользователю
            res.status(200).json({ success: true, answer });
        } catch (error) {
            console.error('Ошибка при обработке запроса:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    } else {
        res.status(404).send('Not found');
    }
};
