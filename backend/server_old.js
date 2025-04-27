
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const xlsx = require('xlsx');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.post('/process', upload.single('file'), async (req, res) => {
    const { provider, apiKey } = req.body;
    const file = req.file;

    if (!file || !provider || !apiKey) {
        return res.status(400).send('Missing required fields.');
    }

    try {
        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const question = jsonData[0][10];
            const studentAnswer = row[10];
            const modelAnswer = row[15];
            const rubric = row[16];

            if (!studentAnswer) continue;

            const prompt = `
Evaluate the student's answer:
Question: ${question}
Student Answer: ${studentAnswer}
Model Answer: ${modelAnswer}
Rubric: ${rubric}

Provide feedback under 50 words. Give a score out of 10.
`;

            const aiResponse = await callAI(provider, apiKey, prompt);
            if (aiResponse) {
                const [feedback, score] = parseAIResponse(aiResponse);
                row[12] = feedback;
                row[17] = score;
            } else {
                row[12] = 'AI Error: No Feedback';
                row[17] = 'AI Error: 0 ';
            }
        }

        const updatedSheet = xlsx.utils.aoa_to_sheet(jsonData);
        const newWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(newWorkbook, updatedSheet, sheetName);

        const outputPath = `processed/processed_${file.filename}.xlsx`;
        xlsx.writeFile(newWorkbook, outputPath);

        res.download(outputPath, () => {
            fs.unlinkSync(file.path);
            fs.unlinkSync(outputPath);
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Processing error.');
    }
});

async function callAI(provider, apiKey, prompt) {
    let url, headers, body;

    if (provider === 'openai') {
        url = 'https://api.openai.com/v1/chat/completions';
        headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
        body = { model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: prompt }], temperature: 0.7 };
    } else if (provider === 'perplexity') {
        url = 'https://api.perplexity.ai/chat/completions';
        headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
        body = { model: 'llama-3-sonar-large-32k-online', messages: [{ role: 'user', content: prompt }], temperature: 0.7 };
    } else if (provider === 'deepseek') {
        url = 'https://api.deepseek.com/chat/completions';
        headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
        body = { model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.7 };
    } else {
        return null;
    }

    try {
        const response = await axios.post(url, body, { headers });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('AI API error:', error?.response?.data || error.message);
        return null;
    }
}

function parseAIResponse(text) {
    let score = text.match(/\b\d{1,2}\b/);
    score = score ? score[0] : '0';
    let feedback = text.replace(/\b\d{1,2}\b/, '').trim();
    return [feedback, score];
}

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('processed')) fs.mkdirSync('processed');

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});
