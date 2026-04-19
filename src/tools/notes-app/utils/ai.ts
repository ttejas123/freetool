export type AIAction = 'summarize' | 'improve' | 'fix_grammar' | 'make_longer' | 'make_shorter' | 'convert_to_table';

const SYSTEM_PROMPTS: Record<AIAction, string> = {
  summarize: 'You are an AI assistant in a Notion-style block editor. Summarize the following text concisely. Only return the summary, nothing else.',
  improve: 'You are an AI assistant. Improve the readability, flow, and vocabulary of the following text. Only return the improved text.',
  fix_grammar: 'You are an AI assistant. Fix the grammar and spelling spelling of the following text. Do not change the meaning. Only return the fixed text.',
  make_longer: 'You are an AI assistant. Expand upon the following text, adding more detail and context. Keep the same tone. Only return the expanded text.',
  make_shorter: 'You are an AI assistant. Shorten the following text while retaining the core message. Only return the shortened text.',
  convert_to_table: 'You are an AI assistant. Convert the following text or messy raw data into a clean JSON array of objects. ONLY return the JSON array, no markdown formatting or backticks.'
};

export async function askOpenAI(
  action: AIAction,
  inputText: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const url = 'https://text.pollinations.ai/';

  const messages = [
    { role: 'system', content: SYSTEM_PROMPTS[action] },
    { role: 'user', content: inputText }
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      jsonMode: action === 'convert_to_table'
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No readable stream');

  const decoder = new TextDecoder('utf-8');
  let resultText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunkStr = decoder.decode(value, { stream: true });
    resultText += chunkStr;
    onChunk(chunkStr);
  }

  // If convert_to_table, ensure we parse clean JSON
  if (action === 'convert_to_table') {
     // sometimes it wraps in ```json ... ``` even with jsonMode
     const match = resultText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
     if (match) return match[1];
  }

  return resultText;
}
