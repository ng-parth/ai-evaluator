import express from 'express';
import fileUpload from 'express-fileupload';
import { MongoClient, ServerApiVersion } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import { processExcelFile } from './services/excelProcessor.js';
import {setDbClient} from "./services/mongoService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3500;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-eval';
console.log('MONGODB_URI: ', MONGODB_URI);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.use(cors());
app.use(fileUpload());
app.use(express.json());


app.get('/api/ping', (req, res) => {
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
        let filename = `processed_file_${new Date().getTime()}`;
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
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
    client.connect().then(resp => {
        console.log('MongoDB connected successfully');
        setDbClient(client);
        // processAiResponse()
    }).catch(e => console.log('Failed to connect to mongo'));

});
