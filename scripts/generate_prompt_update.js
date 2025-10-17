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
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateMessage?key=${apiKey}`;

  const requestBody = {
    input: [
      {
        role: "user",
        contents: [
          {
            parts: [
              {
                text: `以下の内容をもとにGEMINI.mdのプロンプトを更新してください:\n\n${issueBody}`,
              },
            ],
          },
        ],
      },
    ],
    temperature: 1,
    candidateCount: 1,
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`APIレスポンスエラー: ${res.status} ${text}`);
    }

    const data = await res.json();

    // デバッグ用にレスポンス全体を出力
    console.log("=== Gemini API Response ===");
    console.log(JSON.stringify(data, null, 2));
    console.log("===========================");

    const updatedPrompt = data?.candidates?.[0]?.content?.[0]?.text;

    if (!updatedPrompt) {
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
