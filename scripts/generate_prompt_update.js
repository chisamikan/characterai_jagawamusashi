// scripts/generate_prompt_update.js
import fs from "fs";
import fetch from "node-fetch";

const apiKey = vars.GEMINI_API_KEY;
const issueBody = process.env.ISSUE_BODY;
const promptPath = process.env.PROMPT_PATH || "GEMINI.md"; // 対象プロンプト

const promptContent = fs.readFileSync(promptPath, "utf8");

const systemPrompt = `
以下はプロンプトの現行版です。Issueの要望を踏まえて改善案を生成してください。
変更点は明確に反映し、既存の文体や形式は維持してください。
`;

const body = {
  contents: [
    {
      role: "user",
      parts: [{ text: systemPrompt }, { text: "【現行プロンプト】\n" + promptContent }, { text: "【Issue要望】\n" + issueBody }],
    },
  ],
};

(async () => {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  const newPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!newPrompt) {
    console.error("Gemini APIから結果を取得できませんでした。");
    process.exit(1);
  }

  fs.writeFileSync(promptPath, newPrompt, "utf8");
})();
