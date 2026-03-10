export const runtime = "nodejs";

import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const eventId = form.get("eventId");
    const spotId = form.get("spotId");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, message: "ファイルがありません。" },
        { status: 400 }
      );
    }

    if (typeof eventId !== "string" || typeof spotId !== "string") {
      return NextResponse.json(
        { ok: false, message: "eventId または spotId が不足しています。" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || ".jpg";
    const safeName = sanitizeFileName(`${spotId}-${Date.now()}${ext}`);

    const dir = path.join(process.cwd(), "public", "uploads", eventId);
    await fs.mkdir(dir, { recursive: true });

    const fullPath = path.join(dir, safeName);
    await fs.writeFile(fullPath, buffer);

    const publicUrl = `/uploads/${eventId}/${safeName}`;

    return NextResponse.json({
      ok: true,
      url: publicUrl,
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "アップロードに失敗しました。" },
      { status: 500 }
    );
  }
}