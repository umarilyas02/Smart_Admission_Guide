import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

export async function POST(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decoded = verifyToken(token);
  if (!decoded?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { academic_level, matric_marks, intermediate_marks } = await req.json();

  const prompt = `You are an academic counselor for Smart Admission Guide (SAG), a Pakistani university admissions platform. Based solely on the student's previous academic results, suggest the single most suitable university program for them.

Student's Previous Studies:
- Education Level: ${academic_level || "Not specified"}
- Matric Marks: ${matric_marks != null ? matric_marks + "%" : "Not provided"}
- Intermediate Marks: ${intermediate_marks != null ? intermediate_marks + "%" : "Not provided"}

Based only on their academic background and marks (not interests or test scores), recommend the best-fit program.

Respond in this EXACT JSON format (no extra text, no markdown):
{
  "suggestions": [
    {
      "department": "Full Department/Program Name",
      "field": "Broad field (Engineering, Medical, Business, IT, Arts, Science)",
      "matchScore": 90,
      "reason": "1-2 sentence explanation tied specifically to their matric/intermediate marks and education level",
      "careers": ["Career 1", "Career 2", "Career 3"],
      "eligibility": "Brief eligibility note based on their marks"
    }
  ]
}

Provide exactly 1 suggestion. Choose from: Computer Science, Software Engineering, Business Administration, Medicine (MBBS), Civil Engineering, Electrical Engineering, Mechanical Engineering, Psychology, Economics, Architecture, Mass Communication, Law, Pharmacy, Biotechnology, Data Science, Artificial Intelligence, Accounting & Finance.`;

  try {
    const message = await client.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse response");

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Profile suggestion error:", error);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}

export const runtime = "nodejs";
