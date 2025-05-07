import {parseAIResponse} from "./utils.service.js";

let dbClient = null;
const DB_NAME = 'ai-eval'
export const setDbClient = client => dbClient = client.db(DB_NAME);
export const getDbClient = () => dbClient;
export const getCollection = collectionName => dbClient.collection(collectionName);
export const COLLECTIONS = {promptAudit: 'prompt-audit', config:'config'};

// export const processAiResponse = async () => {
//   const results = await getCollection(COLLECTIONS.promptAudit).find({}).toArray();
//   results.forEach(res => {
//     parseAIResponse(res.response.choices[0].message.content, res['_id'].toString());
//   })
//   console.log('Results: ', results.length);
// }
