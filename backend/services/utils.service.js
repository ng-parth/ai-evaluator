import JSON5 from 'json5'

export function chunkArray(array, size) {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
  );
}

export const parseAIResponse = (responseText, id) => {
  let jsonResponse = null;
  // 6817bfe6aa11d6c9ee670747 =? missing " at start of value
  // 6817bfe9aa11d6c9ee670748 =? missing " at start of value
  // 6817bff1aa11d6c9ee67074a => json5
  // 6817c24f678783efa87753b4 => json5
  // 6817c46118c2b21e3d4fc483 =? missing " at start of value
  // 6817c46c18c2b21e3d4fc484
  try {
    // const stringifiedJson = responseText.trim()
    //     .replace(/^```json\s*/i, '')  // Remove starting ```json
    //     .replace(/^```\s*/i, '')      // Or just ```
    //     .replace(/\s*```$/i, '')      // Remove ending ```
    //     .trim();
    // jsonResponse = JSON.parse(stringifiedJson);
    // Step 1: Try to find JSON block inside ``` fences

    // // Second attempt using JSON5
    // const regexFence = /```json\s*([\s\S]*?)\s*```/i;
    // const matchFence = responseText.match(regexFence);
    // let jsonCandidate = matchFence ? matchFence[1] : responseText;
    //
    // const stringifiedJson = JSON5.parse(jsonCandidate);
    // return stringifiedJson;

    // 3rd attempt using json_schema while making request + adding json5
    jsonResponse = JSON5.parse(responseText);
  } catch (e) {
    console.log('Fail to parse response: ');
  }
  return jsonResponse;
};

// Helper to convert Excel Column Letter (e.g., "K") to column number (e.g., 11)
export const columnLetterToNumber = (letter) => {
  let column = 0;
  for (let i = 0; i < letter.length; i++) {
    column *= 26;
    column += letter.charCodeAt(i) - 64;
  }
  return column;
};
