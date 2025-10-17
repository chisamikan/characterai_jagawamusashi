import fs from 'fs';
import fetch from 'node-fetch';

const apiKey = process.env.GEMINI_API_KEY;
const issueBody = process.env.ISSUE_BODY;
const promptPath = process.env.PROMPT_PATH || 'GEMINI.md';

const promptContent = fs.readFileSync(promptPath, 'utf8');

const userPrompt = `
あなたはプロンプト改善の専門家です。
以下のIssue内容を踏まえて、既存のプロンプトを自然かつ一貫性を保って改善してください。

【現行プロンプト】
${promptContent}

【Issueの要望】
${issueBody}
`;

(async () => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      }),
    }
  );

  const data = await res.json();

  // ★ この部分を追加
  console.log('=== Gemini API レスポンス ===');
  console.log(JSON.stringify(data, null, 2));

  if (data.error) {
    console.error('Gemini APIエラー:', data.error);
    process.exit(1);
  }

  const newPrompt = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!newPrompt) {
    console.error('Gemini APIから結果を取得できませんでした。');
    process.exit(1);
  }

  fs.writeFileSync(promptPath, newPrompt, 'utf8');
  console.log('✅ 新しいプロンプト
