export default async (req, res) => {
    if (req.method === 'POST') {
        const { userId, userMessage } = req.body;

        try {
            // Вызов GPT для получения ответа
            const gptResponse = await openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: userMessage }],
            });

            const answer = gptResponse.data.choices[0].message.content;

            console.log(`Ответ от GPT через вебхук: ${answer}`);
            res.status(200).json({ success: true, answer });
        } catch (error) {
            console.error('Ошибка при обработке запроса:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    } else {
        res.status(404).send('Not found');
    }
};
