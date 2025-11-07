import fetch from "node-fetch";
import fs from "fs";

const apiKey = process.env.GEMINI_API_KEY;
const issueBody = process.env.ISSUE_BODY || "";
const promptPath = process.env.PROMPT_PATH || "GEMINI.md";

if (!apiKey) {
  console.error("GEMINI_API_KEYが設定されていません。");
  process.exit(1);
}

if (!issueBody.trim()) {
  console.error("ISSUE_BODYが空です。");
  process.exit(1);
}

async function generateUpdatedPrompt() {
  // 既存のプロンプトファイルを読み込む
  let currentPrompt = "";
  try {
    currentPrompt = fs.readFileSync(promptPath, "utf8");
  } catch (err) {
    console.error(`${promptPath}の読み込みに失敗しました:`, err);
    process.exit(1);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `あなたはキャラクターAI用プロンプトの改善を行うアシスタントです。

以下は現在のプロンプトファイル(GEMINI.md)の内容です:

\`\`\`
${currentPrompt}
\`\`\`

以下はユーザーから提案された改善要求です:

\`\`\`
${issueBody}
\`\`\`

上記の改善要求に基づいて、プロンプトファイルを更新してください。
以下の点に注意してください:

1. 改善要求の内容を適切に反映すること
2. 既存のプロンプトの構造や書式を維持すること
3. 矛盾する内容がないか確認すること
4. キャラクター設定の一貫性を保つこと

更新後のプロンプトファイル全体を出力してください。説明や前置きは不要で、プロンプトの内容のみを出力してください。`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  };

  try {
    console.log("Gemini APIにリクエスト送信中...");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`APIレスポンス: ${text}`);
      throw new Error(`APIエラー: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log("APIレスポンス受信完了");

    // レスポンス構造を確認
    if (!data.candidates || data.candidates.length === 0) {
      console.error("APIレスポンス:", JSON.stringify(data, null, 2));
      throw new Error("candidates が空またはundefinedです");
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.error("候補データ:", JSON.stringify(candidate, null, 2));
      throw new Error("生成されたコンテンツが見つかりません");
    }

    let updatedPrompt = candidate.content.parts[0].text;

    if (!updatedPrompt || updatedPrompt.trim() === "") {
      throw new Error("生成されたプロンプトが空です");
    }

    // マークダウンのコードブロックで囲まれている場合は除去
    updatedPrompt = updatedPrompt.replace(/^```markdown?\n?/i, "").replace(/\n?```$/, "");

    // ファイルに書き込み
    fs.writeFileSync(promptPath, updatedPrompt.trim() + "\n", "utf8");
    console.log(`✅ プロンプトを${promptPath}に更新しました。`);
  } catch (err) {
    console.error("❌ エラーが発生しました:", err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

generateUpdatedPrompt();
