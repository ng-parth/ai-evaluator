import ExcelJS from 'exceljs';
import axios from 'axios';

// ✅ Full Config mapping for each question
const questionConfig = [
  {
    questionCol: 'K',
    modelAnswerCol: 'P',
    rubricCol: 'Q',
    feedbackCol: 'M',
    cheatingProbCol: 'N',
    scoreCol: 'R',
  },
  {
    questionCol: 'T',
    modelAnswerCol: 'Y',
    rubricCol: 'Z',
    feedbackCol: 'V',
    cheatingProbCol: 'W',
    scoreCol: 'X',
  },
  // Add more question mappings as needed
];

// Helper to convert Excel Column Letter (e.g., "K") to column number (e.g., 11)
const columnLetterToNumber = (letter) => {
  let column = 0;
  for (let i = 0; i < letter.length; i++) {
    column *= 26;
    column += letter.charCodeAt(i) - 64;
  }
  return column;
};

export const processExcelFile = async (fileBuffer, aiAgent, apiKey) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.getWorksheet(1);

    const rowsData = [];
    const questions = [];
    // Step 1: Read each row and collect necessary columns
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        for (const config of questionConfig) {
          const question = row.getCell(columnLetterToNumber(config.questionCol)).value || '';
          config.questionText = question;
        }
        // console.log('Question set: ', questionConfig);
        return
      }

      const rowData = { rowNumber, questions: [] };

      for (const config of questionConfig) {
        const questionText = config.questionText.toString().trim();
        const answerText = (row.getCell(columnLetterToNumber(config.questionCol)).value || '').toString().trim();
        const modelAnswer = (row.getCell(columnLetterToNumber(config.modelAnswerCol)).value || '').toString().trim();
        const rubric = (row.getCell(columnLetterToNumber(config.rubricCol)).value || '').toString().trim();

        if (questionText && modelAnswer && rubric) {
          rowData.questions.push({
            questionText,
            answerText,
            modelAnswer,
            rubric,
            feedbackCol: config.feedbackCol,
            cheatingProbCol: config.cheatingProbCol,
            scoreCol: config.scoreCol,
          });
        }
      }
      console.log('question: ', rowData);

      if (rowData.questions.length > 0) {
        rowsData.push(rowData);
      }
    });

    if (rowsData.length === 0) {
      throw new Error('No valid questions found for processing.');
    }

    // Step 2: Process each question via AI
    let successfulResponseCount = 0;
    for (const rowData of rowsData) {
      const row = worksheet.getRow(rowData.rowNumber);

      for (const q of rowData.questions) {
        const prompt = buildPrompt(q);
        const aiResponse = await callAIModel(aiAgent, prompt, apiKey);

        // Assuming AI response format: Feedback\nScore
        const [feedback,cheatingChance, score] = parseAIResponse(aiResponse);

        if (feedback) {
          row.getCell(columnLetterToNumber(q.feedbackCol)).value = feedback;
        }
        if (cheatingChance) {
          row.getCell(columnLetterToNumber(q.cheatingProbCol)).value = score;
        }
        if (score) {
          row.getCell(columnLetterToNumber(q.scoreCol)).value = score;
        }
      }
      row.commit();
    }

    const outputBuffer = await workbook.xlsx.writeBuffer();
    return outputBuffer;

  } catch (error) {
    console.error('Error in excelProcessor:', error.message);
    throw error;
  }
};

const buildPrompt = ({questionText, answerText, modelAnswer, rubric} ) => {
  return `You are an AI evaluator.
            Question: ${questionText}
            Candidate's Response: ${answerText}
            Model Answer: ${modelAnswer}
            Rubric: ${rubric}
          Evaluate the model answer based on the rubric. Provide detailed feedback, give cheating probaility and give a final score out of 10.
Respond in the format:

Feedback: <your feedback>
Cheating: <cheating proability>
Score: <numeric score>
  `.trim();
};

const parseAIResponse = (responseText) => {
  const feedbackMatch = responseText.match(/Feedback:\s*(.*)/i);
  const cheatingChance = responseText.match(/Cheating:\s*(\d+)/i);
  const scoreMatch = responseText.match(/Score:\s*(\d+)/i);

  const feedback = feedbackMatch ? feedbackMatch[1].trim() : '';
  const score = scoreMatch ? scoreMatch[1].trim() : '';
  const cheating = cheatingChance ? cheatingChance[1].trim() : '';

  return [feedback, cheating, score];
};

const callAIModel = async (aiAgent, inputText, apiKey) => {
  try {
    let apiUrl, headers, body;

    if (aiAgent === 'chatgpt') {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      body = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: inputText }],
        temperature: 0.5,
      };
    } else if (aiAgent === 'perplexity') {
      apiUrl = 'https://api.perplexity.ai/completion';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      body = {
        model: 'mistral-7b-instruct',
        messages: [{ role: 'user', content: inputText }],
      };
    } else if (aiAgent === 'deepseek') {
      apiUrl = 'https://api.deepseek.com/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      body = {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: inputText }],
      };
    } else {
      throw new Error('Invalid AI agent specified.');
    }

    const response = await axios.post(apiUrl, body, { headers });

    let aiOutputText;
    if (aiAgent === 'chatgpt' || aiAgent === 'deepseek') {
      aiOutputText = response.data.choices[0].message.content;
    } else if (aiAgent === 'perplexity') {
      aiOutputText = response.data.choices[0].text;
    }

    return aiOutputText.trim();

  } catch (error) {
    console.error('Error calling AI Model:', error.message);
    throw error;
  }
};
