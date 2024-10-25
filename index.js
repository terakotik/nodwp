const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const axios = require('axios');
const { apiId, apiHash, phoneNumber, openAiApiKey, stringSession: configStringSession } = require('./config');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
    apiKey: openAiApiKey,
});
const openai = new OpenAIApi(configuration);

const client = new TelegramClient(new StringSession(configStringSession), apiId, apiHash, {
    connectionRetries: 5,
});

(async () => {
    console.log('Запуск авторизации Telegram...');
    await client.start({
        phoneNumber: phoneNumber,
        onError: (err) => console.log(err),
    });

    console.log('Вы успешно авторизованы!');
    console.log('Сессия:', client.session.save());

    client.addEventHandler(async (update) => {
        if (update.className === 'UpdateNewMessage' && update.message.message) {
            const message = update.message;
            const chatId = message.peerId.userId;
            const userMessage = message.message;

            console.log(`Новое сообщение от пользователя: ${userMessage}`);
            
            // Отправляем запрос к GPT через OpenAI API для получения ответа
            try {
                const gptResponse = await openai.createChatCompletion({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: userMessage }],
                });

                const answer = gptResponse.data.choices[0].message.content;
                await client.sendMessage(chatId, { message: answer });
            } catch (error) {
                console.error('Ошибка при запросе к OpenAI API:', error);
            }
        }
    });
})();


// Инструкция по установке и запуску
// 1. Убедитесь, что на компьютере установлен Node.js и npm.
// 2. Создайте новую папку для проекта и откройте её в Visual Studio Code.
// 3. Создайте три файла: `config.js`, `index.js`, `server.js`.
// 4. Скопируйте соответствующий код в каждый файл.
// 5. В терминале выполните команду `npm init -y` для инициализации проекта.
// 6. Установите необходимые зависимости:
//    npm install telegram input axios express openai nodemon
// 7. Запустите сервер базы знаний командой `node server.js`.
// 8. Запустите Telegram клиент с автоматическим перезапуском командой `npx nodemon index.js`.
// 9. Следуйте инструкциям в терминале для авторизации через Telegram.
// 10. После авторизации Telegram клиент будет слушать новые сообщения и отправлять запросы к OpenAI для ответа.
