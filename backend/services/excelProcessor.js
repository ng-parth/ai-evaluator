import ExcelJS from 'exceljs';
import axios from 'axios';

import {
  CHUNK_BATCH_SIZE,
  MASTER_PROMPT,
  DEFAULT_AI_AGENT,
  QUESTION_CONFIG,
  SAMPLE_RESPONSE,
  ROW_CONFIG
} from './constants.js'
import {COLLECTIONS, getCollection, getDbClient} from "./mongoService.js";
import {chunkArray, parseAIResponse, columnLetterToNumber} from "./utils.service.js";

export const processExcelFile = async (fileBuffer, aiAgent, apiKey) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const worksheetPromises = [];

    const worksheet = workbook.getWorksheet(1);
    worksheetPromises.push(processWorksheets(worksheet));
    // workbook.eachSheet(worksheet => {
    //   worksheetPromises.push(processWorksheets(worksheet));
    // });
    return Promise.allSettled(worksheetPromises).then(wsResp => {
      let totalEvaluatedRow = 0;
      wsResp.map(({ status, value}) => {
        console.log('=== Valies: ', value)
        if (status === 'fulfilled') totalEvaluatedRow += value;
      })
      console.log('totalEvaluatedRow: ', totalEvaluatedRow);
      if (totalEvaluatedRow) {
        // 👉🏽 This will make First sheet the default opened sheet
        workbook.views = [{ activeTab: 0 }];
        return workbook.xlsx.writeBuffer().then(outputBuffer => outputBuffer);
      } else {
        throw Error(`Error processing workbook.`);
      }
    });
  } catch (error) {
    console.error('Error in excelProcessor:', error.message);
    throw error;
  }
};

const buildPrompt = qList => {
  let prompt = `Evalute the ${qList.length} questions below.\n`;
  for (let i = 0; i < qList.length; i++) {
    const {questionText, answerText, modelAnswer, rubric} = qList[i];
    prompt += `\n\nQuestion${i+1}: ${questionText} \nResponse${i+1}: ${answerText} \nIdeal Answer${i+1}: ${modelAnswer} \nRubric${i+1}: ${rubric}\n`;
  }
  prompt += `\n\n Return raw JSON like this without Markdown formatting:
  {
    "questionWiseEvaluation": [{
        ."q": 1, 
        "score": <Numeric score out of 10>, 
        "cheatingProbability": <low|medium|high> 
        "feedback": <provide consize feedback in 2-3 lines in simple english as if you are guiding the candidate directly > 
      }, ...]
    "overallFeedback": <Provide overall feedback in 2-3 lines in simple english as if you are guiding the candidate directly as per point 13 in master prompt based on all the responses by the candidate>,
    "overallScore": <Overall score out of 10>>
  }\n- Please return only JSON without any extra text or comment as this json will be parsed by javascript.`
  return prompt;
};

const getAiEvaluation = async row => {
  const {aiAgent = DEFAULT_AI_AGENT, prompt, apiKey = process.env.PERPLEXITY_API_KEY, rowNumber } = row;
  try {
    let apiUrl, headers, body, model ;
    // return {rowNumber, jsonResponse: Math.random() < 0.1 ? null: parseAIResponse(SAMPLE_RESPONSE)};

    if (aiAgent === 'chatgpt') {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      body = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      };
    } else if (aiAgent === 'perplexity') {
      const perplexityJsonSchema = {
        "type": "json_schema",
        // name: "evaluateAnswers",
        // description: "Evaluates student answers against ideal answers",
        "json_schema": {
          schema: {
            type: "object",
            properties: {
              questionWiseEvaluation: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    q: { type: "integer" },
                    score: { type: "number" },
                    cheatingProbability: { type: "string", enum: ["low", "medium", "high"] },
                    feedback: { type: "string" }
                  },
                  required: ["q", "score", "cheatingProbability", "feedback"]
                }
              },
              overallFeedback: { type: "string" },
              overallScore: { type: "number" }
            },
            required: ["questionWiseEvaluation", "overallFeedback", "overallScore"]
          }

        }
      };
      apiUrl = 'https://api.perplexity.ai/chat/completions';
      model = 'sonar';
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
        model,
        response_format: perplexityJsonSchema,
        "messages":[
            {"role":"system","content": MASTER_PROMPT,},
            {"role":"user", "content": prompt,}
        ]
      };
    } else if (aiAgent === 'deepseek') {
      apiUrl = 'https://api.deepseek.com/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      body = {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
      };
    } else {
      throw new Error('Invalid AI agent specified.');
    }

    const response = await axios.post(apiUrl, body, { headers });
    // db['prompt-audit'].aggregate([{$group: {_id: null, averageTokens: {$avg: '$response.usage.total_tokens'}}}])
    getDbClient() && await getCollection(COLLECTIONS.promptAudit).insertOne({ aiAgent, model, prompt, response: response.data, timestamp: new Date().toString() });
    let jsonResponse = parseAIResponse((response.data.choices[0].message?.content));
    return { rowNumber, jsonResponse };
  } catch (error) {
    console.error('Error calling AI Model:', error.message);
    return Promise.reject({ rowNumber, error: error.message });
  }
};

async function runEvaluatorParallel(allQs) {
  const batches = chunkArray(allQs, CHUNK_BATCH_SIZE);
  console.log(`Total batches: ${batches.length}`);
  let allResults = [];

  // Process batches in chunks of MAX_PARALLEL
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    // const promises = batch.map(batchQ => Promise.resolve(batchQ).then(q => {console.log('== Processed: Q ', q.rowNumber); return {rn: q.rowNumber, prompt: q.prompt.substring(0, 50)}}));
    const promises = batch.map(row => getAiEvaluation(row));
    console.time(`====> Eval Batch: ${i}`);
    await Promise.allSettled(promises).then(results => {
      for(const result of results) {
        const {status, value, reason} = result;
        const isSuccess = status === "fulfilled";
        const rowNumber = value.rowNumber || reason.rowNumber;
        allResults.push({isSuccess, response: value, error: reason, rowNumber });
      }
    });
    console.timeEnd(`====> Eval Batch: ${i}`);
  }
  return allResults;
}

async function processWorksheets (worksheet) {
  console.time(`====> ${worksheet.name}`);
  console.log('\n\n--- Sheet: ', worksheet.name, new Date().getTime());

  // const worksheet = workbook.getWorksheet(1);
  const rowsData = [];
  let totalEvaluatedRow = 0
  // Step 1: Read each row and collect necessary columns
  worksheet.eachRow((row, rowNumber) => {
    // console.log('-- Row: ', rowNumber);
    // if (rowNumber > 2) return;
    if (rowNumber % 2 !== 0) {
      for (const config of QUESTION_CONFIG) {
        const question = row.getCell(columnLetterToNumber(config.questionCol)).value || '';
        config.questionText = question;
      }
      // console.log('Question set: ', questions[rowNumber]);
      return
    }

    const rowData = {rowNumber, questions: []};

    for (const config of QUESTION_CONFIG) {
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
      const prompt = buildPrompt(rowData.questions);
      // console.log('Prompt: ', prompt);
      rowData.prompt = prompt;
      rowsData.push(rowData);
    }
  });

  if (rowsData.length === 0) {
    console.log('No valid questions for processing.', worksheet.name);
  }
  const evals = await runEvaluatorParallel(rowsData);
  console.log('Finl Evals: ', evals);
  for (const rowResult of evals) {
    const {isSuccess, response, reason, rowNumber} = rowResult;
    if (isSuccess && response?.jsonResponse) {
      const {jsonResponse} = response;
      const row = worksheet.getRow(rowNumber);
      for (let i = 0; i < QUESTION_CONFIG.length; i++) {
        const q = QUESTION_CONFIG[i];
        const resp = jsonResponse?.questionWiseEvaluation[i];
        // console.log('Resp: ', rowNumber, resp);
        const {score, cheatingProbability, feedback} = resp;
        row.getCell(columnLetterToNumber(q.scoreCol)).value = score || 'NO SCORE FOUND';
        row.getCell(columnLetterToNumber(q.cheatingProbCol)).value = cheatingProbability || 'NO CHEATING PROB FOUND';
        row.getCell(columnLetterToNumber(q.feedbackCol)).value = feedback || 'NO FEEDBACK FOUND';
      }
      row.getCell(columnLetterToNumber(ROW_CONFIG.overallCommentCol)).value = jsonResponse.overallFeedback || 'NO OVERALL FEEDBACK FOUND';
      row.commit();
      totalEvaluatedRow++;
    } else {
      console.log(`Error Eval ${rowNumber}: `);
    }
  }
  console.log('--- Sheet Process End: ', worksheet.name, new Date().getTime());
  console.timeEnd(`====> ${worksheet.name}`);
  return totalEvaluatedRow;
}
