import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const LEVEL_LABELS = {
  matric:          "Matric",
  fa:              "FA (Faculty of Arts)",
  fsc_medical:     "FSc Pre-Medical",
  fsc_engineering: "FSc Pre-Engineering",
  ics:             "ICS (Computer Science)",
  icom:            "ICom (Commerce)",
};

const ELIGIBLE_PROGRAMS = {
  matric:          "Computer Science, Business Administration, Arts & Humanities, Science (Pre-Medical or Pre-Engineering track), Commerce, Social Sciences — based on the Intermediate program they plan to choose",
  fa:              "Mass Communication, Journalism, Law (LLB), Psychology, Economics, Sociology, Social Work, Education, Political Science, English Literature, Fine Arts, International Relations, Islamic Studies, Public Administration, Linguistics, History",
  fsc_medical:     "Medicine (MBBS), Pharmacy, Dentistry, Physiotherapy, Nursing, Biotechnology, Microbiology, Biomedical Sciences, Veterinary Medicine, Public Health, Nutrition & Dietetics",
  fsc_engineering: "Civil Engineering, Mechanical Engineering, Electrical Engineering, Chemical Engineering, Aerospace Engineering, Architecture, Environmental Engineering, Mechatronics Engineering",
  ics:             "Computer Science, Software Engineering, Data Science, Artificial Intelligence, Cybersecurity, Information Technology, Electrical Engineering, Mathematics",
  icom:            "Business Administration (BBA/MBA), Accounting & Finance, Economics, Commerce, Banking & Finance, Marketing, Human Resource Management, Supply Chain Management, Public Administration",
};

export async function POST(req) {
  const { academic_level, matric_marks, intermediate_marks, interests } = await req.json();

  if (!academic_level) {
    return NextResponse.json({ error: "academic_level is required" }, { status: 400 });
  }

  const levelLabel = LEVEL_LABELS[academic_level] || academic_level;
  const eligible = ELIGIBLE_PROGRAMS[academic_level] || "Various university programs";

  const prompt = `You are an academic counselor for Smart Admission Guide (SAG), a Pakistani university admissions platform.

Generate 8 personalized quiz questions to help this student identify the best university program for them.

Student Profile:
- Education Level: ${levelLabel}
- Matric Marks: ${matric_marks ? matric_marks + "%" : "Not provided"}
- Intermediate Marks: ${intermediate_marks ? intermediate_marks + "%" : "Not provided"}
- Stated Interests: ${interests || "Not specified"}

Programs this student is eligible for: ${eligible}

Instructions:
1. Generate exactly 8 questions. Each must have exactly 4 options.
2. ALL questions and options must relate ONLY to the student's eligible programs above.
3. Questions should help distinguish which specific program within their eligible list suits them best.
4. Mix these question types: subject/topic preference, career goal, work environment, personality trait, problem-solving style.
5. If the student stated interests, tailor some questions to probe those areas more deeply.
6. Keep language simple, friendly, and relatable for a Pakistani high school graduate.
7. Do NOT ask about or reference programs outside their eligible list (e.g. do not mention coding, medicine, or engineering to an FA student).

Respond in this EXACT JSON format (no extra text, no markdown):
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"]
    }
  ]
}`;

  try {
    const message = await client.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse response");

    const result = JSON.parse(jsonMatch[0]);
    if (!result.questions?.length) throw new Error("No questions returned");

    return NextResponse.json(result);
  } catch (error) {
    console.error("Quiz questions generation error:", error);
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }
}

export const runtime = "nodejs";
