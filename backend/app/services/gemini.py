"""
app/services/gemini.py
-----------------------
Gemini AI integration for question generation.
Generates 10 unique MCQ questions on any topic.
"""
import json
import re
import google.generativeai as genai
from app.config import get_settings

settings = get_settings()

if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)


QUESTION_PROMPT = """Generate exactly {n} multiple choice quiz questions about: "{topic}"

Rules:
- Questions must be interesting, not boring textbook facts
- Mix difficulty: 30% easy, 50% medium, 20% hard
- Each question has exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Include a brief explanation for the correct answer
- Make questions engaging and fun for a multiplayer quiz game
- Avoid repeat questions

Return ONLY a valid JSON array. No markdown, no extra text.
Format:
[
  {{
    "question": "Question text here?",
    "options": {{
      "A": "First option",
      "B": "Second option", 
      "C": "Third option",
      "D": "Fourth option"
    }},
    "correct": "A",
    "explanation": "Brief explanation why A is correct"
  }}
]"""


async def generate_questions(topic: str, n: int = 10) -> list[dict]:
    """
    Generate n quiz questions about a topic using Gemini.
    Returns list of question dicts.
    Falls back to demo questions if API key not set.
    """
    if not settings.gemini_api_key:
        return _demo_questions(topic, n)

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = QUESTION_PROMPT.format(topic=topic, n=n)
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Strip markdown code blocks if present
        text = re.sub(r"```json\s*", "", text)
        text = re.sub(r"```\s*", "", text)
        text = text.strip()

        questions = json.loads(text)

        # Validate structure
        validated = []
        for q in questions[:n]:
            if all(k in q for k in ["question", "options", "correct", "explanation"]):
                if all(k in q["options"] for k in ["A", "B", "C", "D"]):
                    if q["correct"] in ["A", "B", "C", "D"]:
                        validated.append(q)

        if len(validated) < n:
            validated.extend(_demo_questions(topic, n - len(validated)))

        return validated[:n]

    except Exception as e:
        print(f"[Gemini] Error: {e} — using demo questions")
        return _demo_questions(topic, n)


def _demo_questions(topic: str, n: int) -> list[dict]:
    """Demo questions when Gemini API key not set."""
    base = [
        {
            "question": f"Which of the following is most associated with {topic}?",
            "options": {"A": "Option Alpha", "B": "Option Beta", "C": "Option Gamma", "D": "Option Delta"},
            "correct": "A",
            "explanation": f"Option Alpha is the primary concept in {topic}."
        },
        {
            "question": f"What year did {topic} first become widely recognised?",
            "options": {"A": "2001", "B": "2010", "C": "2015", "D": "2020"},
            "correct": "B",
            "explanation": "2010 marked the mainstream breakthrough."
        },
        {
            "question": f"Which country is most associated with the origins of {topic}?",
            "options": {"A": "USA", "B": "UK", "C": "Japan", "D": "Germany"},
            "correct": "A",
            "explanation": "The USA pioneered this field."
        },
        {
            "question": f"True or false: {topic} has changed significantly in the last decade.",
            "options": {"A": "True — dramatically", "B": "False — unchanged", "C": "Somewhat", "D": "Not applicable"},
            "correct": "A",
            "explanation": "Major changes have occurred in recent years."
        },
        {
            "question": f"What is the best way to learn about {topic}?",
            "options": {"A": "Read books", "B": "Watch videos", "C": "Practice hands-on", "D": "All of the above"},
            "correct": "D",
            "explanation": "A combination of all approaches works best."
        },
    ]
    result = []
    for i in range(n):
        q = base[i % len(base)].copy()
        q["question"] = f"Q{i+1}: {q['question']}"
        result.append(q)
    return result
