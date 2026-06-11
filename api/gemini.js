export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: { message: 'Method Not Allowed' } });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: { message: 'API key is not configured on the server.' } });
    }

    try {
        const { contents, systemInstruction, generationConfig } = req.body;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const payload = {
            contents,
            systemInstruction,
            generationConfig
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
             return res.status(response.status).json({ error: data.error || { message: 'API Error' } });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error("Gemini API Error in Serverless Function:", error);
        return res.status(500).json({ error: { message: 'Internal Server Error' } });
    }
}
