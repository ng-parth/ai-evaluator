import express from 'express';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import dotenv from 'dotenv';
import { processExcelFile } from './services/excelProcessor.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3500;

app.use(cors());
app.use(fileUpload());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('AI Excel Processor Backend Running ✅');
});

app.post('/api/process-excel', async (req, res) => {
    try {
        const { aiAgent, apiKey } = req.body;
        console.log('Request to process:', aiAgent);
        if (!req.files || !req.files.file) {
            return res.status(400).send('No file uploaded.');
        }

        const file = req.files.file;
        const processedBuffer = await processExcelFile(file.data, aiAgent, apiKey);

        res.setHeader('Content-Disposition', 'attachment; filename=processed_file.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(processedBuffer);
    } catch (error) {
        const errMessage = error?.message || 'Error processing file.';
        console.error('Error during processing:', error?.response || errMessage);
        res.status(500).send(errMessage);
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server started on http://localhost:${PORT}`);
});
