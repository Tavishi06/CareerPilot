from dataclasses import dataclass


@dataclass(frozen=True)
class LearningResource:
    title: str
    url: str
    objective: str
    estimated_hours: int
    prerequisites: tuple[str, ...] = ()


LEARNING_RESOURCES = {
    "AWS": LearningResource(
        title="AWS Skill Builder",
        url="https://skillbuilder.aws/",
        objective="Learn core cloud concepts and practice navigating AWS services.",
        estimated_hours=5,
    ),
    "Communication": LearningResource(
        title="Wharton: Improving Communication Skills",
        url="https://www.coursera.org/learn/wharton-communication-skills",
        objective="Practice structuring messages and communicating ideas clearly.",
        estimated_hours=4,
    ),
    "Data Analysis": LearningResource(
        title="Kaggle: Data Cleaning",
        url="https://www.kaggle.com/learn/data-cleaning",
        objective="Practice finding, cleaning, and validating data with Python.",
        estimated_hours=4,
        prerequisites=("Python",),
    ),
    "Docker": LearningResource(
        title="Docker Get Started",
        url="https://docs.docker.com/get-started/",
        objective="Build and run a containerized application.",
        estimated_hours=4,
        prerequisites=("Git",),
    ),
    "FastAPI": LearningResource(
        title="FastAPI Tutorial",
        url="https://fastapi.tiangolo.com/tutorial/",
        objective="Build an API with request validation and generated documentation.",
        estimated_hours=5,
        prerequisites=("Python",),
    ),
    "Git": LearningResource(
        title="Pro Git Book",
        url="https://git-scm.com/book/en/v2",
        objective="Practice commits, branches, and merging in a small project.",
        estimated_hours=3,
    ),
    "Generative AI": LearningResource(
        title="Hugging Face LLM Course",
        url="https://huggingface.co/learn/llm-course/chapter1/1",
        objective="Understand language model fundamentals and build a small demo.",
        estimated_hours=6,
        prerequisites=("Python",),
    ),
    "Machine Learning": LearningResource(
        title="scikit-learn Tutorials",
        url="https://scikit-learn.org/stable/tutorial/index.html",
        objective="Train and evaluate a baseline model on a small dataset.",
        estimated_hours=6,
        prerequisites=("Python", "Statistics"),
    ),
    "Python": LearningResource(
        title="The Python Tutorial",
        url="https://docs.python.org/3/tutorial/",
        objective="Write a small program using core Python data structures and functions.",
        estimated_hours=5,
    ),
    "RAG": LearningResource(
        title="LangChain RAG Tutorial",
        url="https://python.langchain.com/docs/tutorials/rag/",
        objective="Build a retrieval-augmented question-answering prototype.",
        estimated_hours=5,
        prerequisites=("Python", "Generative AI"),
    ),
    "React": LearningResource(
        title="Learn React",
        url="https://react.dev/learn",
        objective="Build an interactive interface using components and state.",
        estimated_hours=5,
    ),
    "SQL": LearningResource(
        title="SQLBolt",
        url="https://sqlbolt.com/",
        objective="Practice querying and joining data from relational tables.",
        estimated_hours=4,
    ),
    "Statistics": LearningResource(
        title="Khan Academy: Statistics and Probability",
        url="https://www.khanacademy.org/math/statistics-probability",
        objective="Review distributions, sampling, and basic statistical reasoning.",
        estimated_hours=5,
    ),
}
