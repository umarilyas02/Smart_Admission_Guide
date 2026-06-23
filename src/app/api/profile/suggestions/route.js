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

  const PROGRAMS_BY_LEVEL = {
    fa:              "Mass Communication, Journalism, Law (LLB), Psychology, Economics, Sociology, Social Work, Education, Political Science, English Literature, Fine Arts, International Relations, Islamic Studies, Public Administration, Linguistics, History",
    fsc_medical:     "Medicine (MBBS), Pharmacy, Dentistry, Physiotherapy, Nursing, Biotechnology, Microbiology, Biomedical Sciences, Veterinary Medicine, Public Health, Nutrition & Dietetics",
    fsc_engineering: "Civil Engineering, Mechanical Engineering, Electrical Engineering, Chemical Engineering, Aerospace Engineering, Architecture, Environmental Engineering, Mechatronics Engineering",
    ics:             "Computer Science, Software Engineering, Data Science, Artificial Intelligence, Cybersecurity, Information Technology, Electrical Engineering, Mechatronics Engineering, Mathematics",
    icom:            "Business Administration (BBA/MBA), Accounting & Finance, Economics, Commerce, Banking & Finance, Marketing, Human Resource Management, Supply Chain Management, Public Administration",
  };

  const allowedPrograms = PROGRAMS_BY_LEVEL[academic_level]
    || "Computer Science, Software Engineering, Business Administration, Medicine (MBBS), Civil Engineering, Electrical Engineering, Mechanical Engineering, Psychology, Economics, Architecture, Mass Communication, Law, Pharmacy, Biotechnology, Data Science, Artificial Intelligence, Accounting & Finance";

  const prompt = `You are an academic counselor for Smart Admission Guide (SAG), a Pakistani university admissions platform. Based solely on the student's previous academic results, suggest the single most suitable university program for them, plus up to 3 alternatives they could also consider.

Student's Previous Studies:
- Education Level: ${academic_level || "Not specified"}
- Matric Marks: ${matric_marks != null ? matric_marks + "%" : "Not provided"}
- Intermediate Marks: ${intermediate_marks != null ? intermediate_marks + "%" : "Not provided"}

Based only on their academic background and marks (not interests or test scores), recommend the best-fit program.

IMPORTANT: Only recommend programs the student is eligible for based on their education level. Do NOT suggest programs outside this allowed list.

Respond in this EXACT JSON format (no extra text, no markdown):
{
  "suggestions": [
    {
      "department": "Full Department/Program Name",
      "field": "Broad field (Engineering, Medical, Business, IT, Arts, Science)",
      "matchScore": 90,
      "reason": "1-2 sentence explanation tied specifically to their matric/intermediate marks and education level",
      "careers": ["Career 1", "Career 2", "Career 3"],
      "eligibility": "Brief eligibility note based on their marks",
      "alternatives": ["Alternative Program 1", "Alternative Program 2", "Alternative Program 3"]
    }
  ]
}

Provide exactly 1 suggestion with 2-3 alternatives. Choose ONLY from: ${allowedPrograms}.`;

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
