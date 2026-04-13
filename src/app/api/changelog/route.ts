import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
    if (!fs.existsSync(changelogPath)) {
      return NextResponse.json({ content: "Changelog not found." });
    }
    const content = fs.readFileSync(changelogPath, "utf-8");
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error reading CHANGELOG.md:", error);
    return NextResponse.json({ error: "Failed to read changelog" }, { status: 500 });
  }
}
