// Импорт библиотек
require('dotenv').config();

const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { OpenAIApi, Configuration } = require('openai');
const express = require('express'); // Добавляем express для создания REST API
const axios = require('axios'); // Добавляем axios для отправки вебхука
const { apiId, apiHash, phoneNumber, openAiApiKey, stringSession: configStringSession } = require('./config');

// Настройка OpenAI API
const configuration = new Configuration({
    apiKey: openAiApiKey,
});
const openai = new OpenAIApi(configuration);

// Создание клиента Telegram
const client = new TelegramClient(new StringSession(configStringSession), apiId, apiHash, {
    connectionRetries: 5,
});

// Создание REST API с использованием Express
const app = express();
app.use(express.json());

app.post('/webhook', async (req, res) => {
    const { userId, userMessage } = req.body;
    try {
        // Отправляем запрос к GPT через OpenAI API для получения ответа
        const gptResponse = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: userMessage }],
        });

        const answer = gptResponse.data.choices[0].message.content;
        console.log(`Ответ от GPT через REST API: ${answer}`);

        // Отправляем сообщение обратно пользователю
        await client.invoke(new Api.messages.SendMessage({
            peer: await client.getInputEntity(userId),
            message: answer,
            randomId: BigInt(Math.floor(Math.random() * 1e10)),
        }));

        res.status(200).send({ success: true, answer });
    } catch (error) {
        console.error('Ошибка при обработке вебхука:', error);
        res.status(500).send({ success: false, error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Сервер REST API запущен на порту 3000');
});

(async () => {
    console.log('Запуск авторизации Telegram...');
    await client.start({
        phoneNumber: () => phoneNumber,
        onError: (err) => console.log(err),
    });

    console.log('Вы успешно авторизованы!');
    console.log('Сессия:', client.session.save());

    // Загружаем диалоги для кэширования сущностей пользователей
    await client.getDialogs();

    client.addEventHandler(async (update) => {
        try {
            // Обрабатываем только личные сообщения от пользователя
            if (
                (update.className === 'UpdateNewMessage' && update.message && update.message.peerId && update.message.peerId.className === 'PeerUser' && !update.message.out) ||
                (update.className === 'UpdateShortMessage' && update.userId && !update.out)
            ) {
                let userMessage;
                let userId;

                if (update.className === 'UpdateNewMessage') {
                    const message = update.message;
                    userId = message.peerId.userId;
                    userMessage = message.message;
                } else if (update.className === 'UpdateShortMessage') {
                    userId = update.userId;
                    userMessage = update.message;
                }

                if (userId && userMessage) {
                    console.log(`Новое сообщение от пользователя ${userId}: ${userMessage}`);
                    
                    try {
                        // Отправляем запрос к GPT через OpenAI API для получения ответа
                        const gptResponse = await openai.createChatCompletion({
                            model: 'gpt-3.5-turbo',
                            messages: [{ role: 'user', content: userMessage }],
                        });

                        let answer = gptResponse.data.choices[0].message.content;
                        console.log(`Ответ от GPT: ${answer}`);

                        // Добавляем небольшую задержку и имитацию опечаток перед отправкой ответа
                        answer = answer.split('').map((char, index) => (Math.random() < 0.05 && index !== 0) ? char + char : char).join('');
                        await new Promise((resolve) => setTimeout(resolve, 1000));

                        // Отправляем сообщение обратно пользователю
                        await client.invoke(new Api.messages.SendMessage({
                            peer: await client.getInputEntity(userId),
                            message: answer,
                            randomId: BigInt(Math.floor(Math.random() * 1e10)),
                        }));

                        // Отправляем вебхук с данными ответа
                        await axios.post('https://nodwp-terakotiks-projects.vercel.app/webhook', {
                            userId,
                            userMessage,
                            answer,
                        });
                    } catch (error) {
                        // Если не удалось найти пользователя, пробуем обновить список диалогов
                        if (error.message.includes('Could not find the input entity')) {
                            console.log('Попытка обновить список диалогов и повторить отправку сообщения.');
                            await client.getDialogs();
                            try {
                                await client.invoke(new Api.messages.SendMessage({
                                    peer: await client.getInputEntity(userId),
                                    message: answer,
                                    randomId: BigInt(Math.floor(Math.random() * 1e10)),
                                }));
                            } catch (retryError) {
                                console.error('Ошибка при повторной отправке сообщения:', retryError);
                            }
                        } else {
                            console.error('Ошибка при отправке сообщения:', error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка при обработке события:', error);
        }
    });
})();
