import ExcelJS from 'exceljs';
import axios from 'axios';

// Token helper
function estimateTokens(text) {
  return Math.ceil(text.length / 4); // Rough English average
}

const MAX_PROMPT_TOKENS = 500;
const MAX_RESPONSE_TOKENS = 100;
const MAX_BATCH_TOKENS = 3500;

export async function processExcelFile(fileBuffer, aiAgent, apiKey) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  const worksheet = workbook.worksheets[0];
  const prompts = [];
  const skipped = [];

  // Prepare prompts and skip oversized ones
  for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
    const row = worksheet.getRow(rowIndex);
    const inputCell = row.getCell(1);

    if (inputCell.value) {
      let text = String(inputCell.value);
      const tokenEstimate = estimateTokens(text);

      if (tokenEstimate > MAX_PROMPT_TOKENS) {
        skipped.push({ rowIndex });
      } else {
        prompts.push({ prompt: text, rowIndex });
      }
    }
  }

  // Smart batching
  const batches = [];
  let currentBatch = [];
  let currentTokens = 0;

  prompts.forEach(p => {
    const tokens = estimateTokens(p.prompt) + MAX_RESPONSE_TOKENS;
    if (currentTokens + tokens > MAX_BATCH_TOKENS) {
      batches.push(currentBatch);
      currentBatch = [];
      currentTokens = 0;
    }
    currentBatch.push(p);
    currentTokens += tokens;
  });
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  // Process batches
  for (const batch of batches) {
    const aiResponses = await sendBatchToAIService(batch.map(p => p.prompt), aiAgent, apiKey);

    batch.forEach((p, idx) => {
      const row = worksheet.getRow(p.rowIndex);
      const outputCell = row.getCell(2);
      outputCell.value = aiResponses[idx] || 'No response';
    });
  }

  // Handle skipped rows
  skipped.forEach(p => {
    const row = worksheet.getRow(p.rowIndex);
    const outputCell = row.getCell(2);
    outputCell.value = 'Skipped: input too large';
  });

  const outputBuffer = await workbook.xlsx.writeBuffer();
  return outputBuffer;
}

async function sendBatchToAIService(prompts, aiAgent, apiKey) {
  try {
    const response = await axios.post('https://api.example-ai.com/batch-generate', {
      prompts,
      agent: aiAgent,
      max_tokens: MAX_RESPONSE_TOKENS,
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    } else {
      throw new Error('Invalid batch response from AI service');
    }
  } catch (error) {
    console.error('Batch API call failed:', error.message);
    return prompts.map(() => 'Error fetching AI response');
  }
}
