export const MASTER_PROMPT = `
1. You must read the question and form an answer guideline.

2. Then evaluate the candidate’s answer against your answer guideline.

3. Evaluate the candidate’s answer based on the analytic rubric method where the rubric parameters would be broadly as follows: 
      - How well the candidate understands the scope and context of the question – This will carry up to 20% weight in your feedback and score.
      - How good is the conceptual clarity of the candidate on the topic – This will carry up to 20% weight in your feedback and score.
      - How well is their analytical skill reflecting in the answer - This will carry up to 20% weight in your feedback and score.
      - How well is their reasoning skill reflecting in the answer- This will carry up to 20% weight in your feedback and score.
      - How clear and structured is their line of thought - This will carry up to 20% weight in your feedback and score.
 
4. The language proficiency like grammar, spelling, etc. must not be given any weight.

5. If the answer is copied or written by using some kind of short cuts like using internet content or using AI tools, then this should be looked upon seriously. If the cheating is rampant i.e. the answers reflect lack of originality and no individual effort at all, then score should be 0. This will override all the other scoring guideline . If there is use of AI or internet content but it is combined with individual knowledge and effort in bringing insights , then do comment on the need to follow ethical means to write answers. But depending on the extent of such usage and individual effort, score as appropriate.

6. To check if the answer is written by using AI , work on the probability of AI usage as follows:
      - Analyse the writing style, use of language and explanation in their answer to the generic question. Ideally, this is likely to be written by the candidate themselves.( If there is use of AI in this answer too, then highlight it in your overall comments). Compare this with the writing style, use of language and explanation in the answer that is being evaluated .
      - Analyse the writing style, use of language and explanation in the other answers written by them. Then compare it with the writing style, use of language and explanation in the answer that is being evaluated .
      - If you have responses submitted by multiple candidates to the same question, then compare writing style, use of language and explanation in the Candidate’s answer with the writing style, use of language and explanation in other candidate’s answer to determine if the answer is copied from or shared with one another.
      - Based on your analysis of the above points, assign a ‘cheating probability’ for the answer along with your comments in one line on whether and why you think there is cheating
 
7. If there is a model answer guideline defined for a certain question, then follow that as a first preference instead of forming your own guideline as mentioned in point no.1 above.

8. If the Rubric parameters are defined and set for a certain question, then follow that instead of using the rubric parameters as defined in point no 3 above.

9. Other points will apply in all situations.
10. After this, based on your analysis as per the above, for every answer you must
    a) Provide your score as a percentage 
    b) Provide your assessment of the cheating probability in the answer.
    c) Provide your feedback  to the candidate in less than 40 words
    d) Analyse the candidate’s writing style and language in all their answers and assess how you must communicate the feedback to the candidate using a similar language. The idea is that they should be able to relate with what you have written based on their level of knowledge and language proficiency,
    e) Rewrite your feedback in a concise way based on your analysis in point no 10(d)

11.  After this, assess all other answers of the candidate for other questions in the test and provide the summary against each answer as per point no.10

12.  After this, calculate the average score for the candidate in the test.

13. After this, provide an overall feedback to the candidate in the test.
`;

// ✅ Full Config mapping for each question
export const QUESTION_CONFIG = [
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
  {
    questionCol: 'AC',
    modelAnswerCol: 'AH',
    rubricCol: 'AI',
    feedbackCol: 'AE',
    cheatingProbCol: 'AF',
    scoreCol: 'AG',
  },
  {
    questionCol: 'AL',
    modelAnswerCol: 'AQ',
    rubricCol: 'AR',
    feedbackCol: 'AN',
    cheatingProbCol: 'AO',
    scoreCol: 'AP',
  },
  {
    questionCol: 'AU',
    modelAnswerCol: 'AZ',
    rubricCol: 'BA',
    feedbackCol: 'AW',
    cheatingProbCol: 'AX',
    scoreCol: 'AY',
  },
];

export const ROW_CONFIG = {overallCommentCol: 'BD'};

export const CHUNK_BATCH_SIZE = 5;
export const DEFAULT_AI_AGENT = 'perplexity';
export const SAMPLE_RESPONSE = `\`\`\`json
{
  "questionWiseEvaluation": [
    {
      "q": 1,
      "score": 40,
      "cheatingProbability": "Low probability of cheating",
      "feedback": "Needs improvement in explaining stages of money laundering and its implications."
    },
    {
      "q": 2,
      "score": 60,
      "cheatingProbability": "Low probability of cheating",
      "feedback": "Good understanding of KYC, but could elaborate more on its role in preventing money laundering."
    },
    {
      "q": 3,
      "score": 70,
      "cheatingProbability": "Low probability of cheating",
      "feedback": "Clear explanation of flat and reducing rates, but lacks detailed comparison."
    },
    {
      "q": 4,
      "score": 50,
      "cheatingProbability": "Low probability of cheating",
      "feedback": "Identified key regulators but needs more depth on their functions."
    },
    {
      "q": 5,
      "score": 80,
      "cheatingProbability": "Low probability of cheating",
      "feedback": "Good explanation of fixed and floating rates, with clear differences."
    }
  ],
  "overallFeedback": "Generally good understanding, but needs improvement in depth and clarity across questions."
}
\`\`\``

