import re


SKILL_TERMS = {
    "AWS": ("aws", "amazon web services"),
    "Communication": ("communication", "communicate"),
    "Data Analysis": ("data analysis", "data analytics"),
    "Docker": ("docker",),
    "FastAPI": ("fastapi",),
    "Git": ("git", "github"),
    "Generative AI": ("generative ai", "genai", "llm", "large language model"),
    "Machine Learning": ("machine learning", "ml"),
    "Python": ("python",),
    "RAG": ("rag", "retrieval augmented generation"),
    "React": ("react", "react.js"),
    "SQL": ("sql", "postgresql", "mysql"),
    "Statistics": ("statistics", "statistical"),
}


def extract_skills(text: str) -> list[str]:
    normalized_text = text.casefold()
    found = []

    for skill, terms in SKILL_TERMS.items():
        if any(
            re.search(rf"(?<!\w){re.escape(term)}(?!\w)", normalized_text)
            for term in terms
        ):
            found.append(skill)

    return found


def analyze_skills(resume_text: str, job_description: str) -> dict[str, object]:
    resume_skills = extract_skills(resume_text)
    required_skills = extract_skills(job_description)
    resume_skill_set = set(resume_skills)
    matched_skills = [
        skill for skill in required_skills if skill in resume_skill_set
    ]
    missing_skills = [
        skill for skill in required_skills if skill not in resume_skill_set
    ]
    match_percentage = (
        round(len(matched_skills) / len(required_skills) * 100)
        if required_skills
        else 0
    )

    return {
        "resume_skills": resume_skills,
        "required_skills": required_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "match_percentage": match_percentage,
    }
