export const runtime = "nodejs";

import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import type { JudgeResult } from "@/lib/types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function mimeFromExt(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

async function localImagePathToDataUrl(publicPath: string) {
  const normalized = publicPath.startsWith("/")
    ? publicPath.slice(1)
    : publicPath;

  const fullPath = path.join(process.cwd(), "public", normalized);
  const buffer = await fs.readFile(fullPath);
  const mime = mimeFromExt(fullPath);
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

async function resolveReferenceImage(refImageUrl: string) {
  if (
    refImageUrl.startsWith("data:image/") ||
    refImageUrl.startsWith("http://") ||
    refImageUrl.startsWith("https://")
  ) {
    return refImageUrl;
  }

  return localImagePathToDataUrl(refImageUrl);
}

function extractTextContent(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (item?.type === "text" && typeof item?.text === "string") return item.text;
        return "";
      })
      .join("\n");
  }

  return "";
}

export async function judgePhoto(params: {
  spotTitle: string;
  refImageUrl: string;
  imageDataUrl: string;
}): Promise<JudgeResult> {
  const { spotTitle, refImageUrl, imageDataUrl } = params;

  if (!process.env.OPENAI_API_KEY) {
    return {
      ok: false,
      reason: "OPENAI_API_KEY が設定されていません。",
    };
  }

  try {
    const referenceImage = await resolveReferenceImage(refImageUrl);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text:
                "あなたは画像照合の判定AIです。見本画像と参加者画像が同じ場所かどうかを判定してください。" +
                "許容: 角度違い、明るさ違い、多少のズーム違い。" +
                "不許可: 明らかに別の場所、別の被写体。" +
                "必ずJSONのみで返答してください。" +
                '形式: {"ok":true/false,"reason":"20文字以上80文字以内で日本語"}',
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                `対象スポット名: ${spotTitle}\n` +
                "1枚目が見本画像、2枚目が参加者画像です。" +
                "同じ場所なら ok=true、違うなら ok=false を返してください。",
            },
            {
              type: "image_url",
              image_url: {
                url: referenceImage,
              },
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
    });

    const raw = extractTextContent(response.choices[0]?.message?.content).trim();

    let parsed: { ok: boolean; reason: string } | null = null;

    try {
      parsed = JSON.parse(raw);
    } catch {
      const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();

      parsed = JSON.parse(cleaned);
    }

    if (!parsed) {
      return {
        ok: false,
        reason: "AIの返答を解析できませんでした。",
      };
    }

    return {
      ok: !!parsed.ok,
      reason: parsed.reason || (parsed.ok ? "一致しました。" : "一致しませんでした。"),
    };
  } catch (error) {
    console.error("judgePhoto error:", error);

    return {
      ok: false,
      reason: "AI判定でエラーが発生しました。",
    };
  }
}