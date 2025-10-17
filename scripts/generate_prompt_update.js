import fetch from "node-fetch";
import fs from "fs";

const apiKey = process.env.GEMINI_API_KEY;
const issueBody = process.env.ISSUE_BODY || "";
const promptPath = process.env.PROMPT_PATH || "GEMINI.md";

if (!apiKey) {
  console.error("GEMINI_API_KEYが設定されていません。");
  process.exit(1);
}

async function generateUpdatedPrompt() {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

  const requestBody = {
    prompt: {
      text: `以下の内容をもとにGEMINI.mdのプロンプトを更新してください:\n\n${issueBody}`,
    },
    temperature: 1,
    candidateCount: 1,
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const text = await res.text(); // 生のレスポンスを取得
    if (!res.ok) {
      console.error("APIレスポンスエラー:", res.status, text);
      throw new Error("Gemini APIから結果を取得できませんでした。");
    }

    let data;
    try {
      data = JSON.parse(text); // JSON にパース
    } catch (jsonErr) {
      console.error("JSONパースエラー:", jsonErr, "レスポンス:", text);
      throw new Error("APIレスポンスのパースに失敗しました。");
    }

    const updatedPrompt = data?.candidates?.[0]?.content?.text;
    if (!updatedPrompt) {
      console.error("APIレスポンス内容:", JSON.stringify(data, null, 2));
      throw new Error("生成されたプロンプトが取得できませんでした。");
    }

    fs.writeFileSync(promptPath, updatedPrompt, "utf8");
    console.log(`プロンプトを${promptPath}に更新しました。`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

generateUpdatedPrompt();
