// webhook.js
import { Configuration, OpenAIApi } from 'openai';
import express from 'express';

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// База знаний в виде массива (пример)
const knowledgeBase = [
    { question: "ты трейдер?", answer: "Нет, я не трейдер. Я искусственный интеллект, созданный для общения и помощи людям в различных сферах." },
    { question: "что такое алгоритмическая торговля?", answer: "Алгоритмическая торговля — это использование компьютерных программ для выполнения торговых операций по заданным правилам." },
    // Добавьте другие вопросы и ответы здесь
];

// Функция для поиска ответа в базе знаний
function getKnowledgeBaseAnswer(question) {
    const entry = knowledgeBase.find(item => item.question.toLowerCase() === question.toLowerCase());
    return entry ? entry.answer : null;
}

export default async (req, res) => {
    if (req.method === 'POST') {
        const { userMessage } = req.body;

        try {
            // Сначала ищем ответ в базе знаний
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

            // Лог ответа
            console.log(`Ответ через вебхук: ${answer}`);

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

