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
    scoreCol: 'O',
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
      // console.log('question: ', rowData);

      if (rowData.questions.length > 0) {
        rowsData.push(rowData);
      }
    });

    if (rowsData.length === 0) {
      throw new Error('No valid questions found for processing.');
    }

    // Step 2: Process each question via AI
    let successfulRowCount = 0;
    for (const rowData of rowsData) {
      const row = worksheet.getRow(rowData.rowNumber);
      let successfulRowQuestionCount = 0;
      for (const q of rowData.questions) {
        const prompt = buildPrompt(q);
        try {
          // console.log('Prompt: ', prompt);
          const aiResponse = await callAIModel(aiAgent, prompt, apiKey);

          // Assuming AI response format: Feedback\nScore
          const [feedback,cheatingChance, score] = parseAIResponse(aiResponse);
          row.getCell(columnLetterToNumber(q.feedbackCol)).value = feedback || 'NO FEEDBACK FOUND';
          row.getCell(columnLetterToNumber(q.cheatingProbCol)).value = cheatingChance || 'NO CHEATING PROB FOUND';
          row.getCell(columnLetterToNumber(q.scoreCol)).value = score || 'NO SCORE FOUND';
          successfulRowQuestionCount++;
        } catch (e) {
          console.log('Fail to process: row: ', rowData.rowNumber, ' QuestionText: ', q.questionText);
        }
      }
      if (successfulRowQuestionCount) {
        row.commit();
        successfulRowCount++;
      }
    }
    if (successfulRowCount) {
      const outputBuffer = await workbook.xlsx.writeBuffer();
      return outputBuffer;
    } else {
     throw new Error('No questions processed!');
    }
  } catch (error) {
    console.error('Error in excelProcessor:', error.message);
    throw error;
  }
};

const buildPrompt = ({questionText, answerText, modelAnswer, rubric} ) => {
  return `Question: ${questionText}
            Candidate's Response: ${answerText}
            Ideal Answer: ${modelAnswer}
            Rubric: ${rubric}
          Evaluate Candidate's response based on the rubric and the Ideal Answer. Provide concise feedback on candidate's response in 40-50 words, give cheating probaility and give a final score out of 10.
Respond in the format:

Feedback: <your feedback>
Cheating Probability: <high | Low>
Score: <numeric score out of 10>
  `.trim();
};

const parseAIResponse = (responseText) => {
  console.log('AI Response: ', responseText);
  let feedbackMatch = responseText.match(/Feedback:\s*(.*)/i);
  let cheatingChance = responseText.match(/Cheating Probability:\s*(.*)/i);
  let scoreMatch = responseText.match(/Score:\s*(\d+)/i);

  let feedback = feedbackMatch ? feedbackMatch[1].trim() : '';
  let score = scoreMatch ? scoreMatch[1].trim() : '';
  let cheating = cheatingChance ? cheatingChance[1].trim() : '';

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
      apiUrl = 'https://api.perplexity.ai/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      body = {
        "temperature":0.2,
        "top_p":0.9,
        "return_images":false,
        "return_related_questions":false,
        "top_k":0,
        "stream":false,
        "presence_penalty":0,
        "frequency_penalty":1,
        "web_search_options":{"search_context_size":"low"},
        "model":"sonar",
        "messages":[
            {"role":"system","content":"You are an AI evaluator. Evaluate the following question based on the rubric parameters given in the question",},
            {"role":"user", "content":inputText,}
        ]
      };

      // body = {
      //   model: 'sonar',
      //   messages: [{ role: 'user', content: inputText }],
      // };
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
      aiOutputText = response.data.choices[0].message?.content || '';
    }

    return aiOutputText.trim();

  } catch (error) {
    console.error('Error calling AI Model:', error.message);
    throw error;
  }
};

