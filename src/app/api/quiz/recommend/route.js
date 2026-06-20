import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

export async function POST(request) {
  try {
    const { questions, answers, academic_level } = await request.json();

    if (!questions || !answers) {
      return Response.json(
        { error: "Missing questions or answers" },
        { status: 400 }
      );
    }

    const PROGRAMS_BY_LEVEL = {
      fa:              "Mass Communication, Journalism, Law (LLB), Psychology, Economics, Sociology, Social Work, Education, Political Science, English Literature, Fine Arts, International Relations, Islamic Studies, Public Administration, Linguistics, History",
      fsc_medical:     "Medicine (MBBS), Pharmacy, Dentistry, Physiotherapy, Nursing, Biotechnology, Microbiology, Biomedical Sciences, Veterinary Medicine, Public Health, Nutrition & Dietetics",
      fsc_engineering: "Civil Engineering, Mechanical Engineering, Electrical Engineering, Chemical Engineering, Aerospace Engineering, Architecture, Environmental Engineering, Mechatronics Engineering",
      ics:             "Computer Science, Software Engineering, Data Science, Artificial Intelligence, Cybersecurity, Information Technology, Electrical Engineering, Mechatronics Engineering, Mathematics",
      icom:            "Business Administration (BBA/MBA), Accounting & Finance, Economics, Commerce, Banking & Finance, Marketing, Human Resource Management, Supply Chain Management, Public Administration",
    };

    const allowedPrograms = PROGRAMS_BY_LEVEL[academic_level]
      || "Computer Science, Software Engineering, Business Administration, Medicine (MBBS), Civil Engineering, Electrical Engineering, Mechanical Engineering, Psychology, Economics, Architecture, Mass Communication, Law, Education, Pharmacy, Biotechnology, Accounting & Finance, Data Science, Artificial Intelligence";

    const levelNote = academic_level
      ? `\n\nStudent's Education Level: ${academic_level.toUpperCase().replace("_", " ")}. You MUST only recommend programs this student is eligible for based on their education level.`
      : "";

    const answersText = questions
      .map(
        (q, idx) =>
          `Q${idx + 1}: ${q.question}\nStudent's Answer: ${
            q.options[answers[idx]] ?? "Not answered"
          }`
      )
      .join("\n\n");

    const prompt = `You are an expert academic counselor for a Smart Admission Guide (SAG) system in Pakistan. Based on a student's aptitude and interest quiz answers, recommend the most suitable academic department for them.${levelNote}

Student's Quiz Responses:
${answersText}

Analyze these responses carefully and respond in this EXACT JSON format (no extra text, no markdown):
{
  "primaryDepartment": "Full Department Name",
  "field": "Broad field (e.g. Engineering, Medical, Business, IT, Arts)",
  "confidence": 82,
  "alternativeDepartments": ["Second Best Department", "Third Best Department"],
  "explanation": "2-3 sentence explanation of why this department matches the student's profile.",
  "strengths": ["Strength observed 1", "Strength observed 2", "Strength observed 3"],
  "careers": ["Career path 1", "Career path 2", "Career path 3"]
}

IMPORTANT: Choose ONLY from these eligible departments: ${allowedPrograms}.`;

    const message = await client.messages.create({
      model: process.env.CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse SAG response");
    }

    const recommendation = JSON.parse(jsonMatch[0]);

    return Response.json({ recommendation });
  } catch (error) {
    console.error("Quiz recommendation error:", error);
    return Response.json(
      { error: "Failed to generate recommendation. Please try again." },
      { status: 500 }
    );
  }
}
