from collections.abc import Sequence
from dataclasses import dataclass


@dataclass(frozen=True)
class RubricConcept:
    label: str
    accepted_terms: tuple[str, ...]


@dataclass(frozen=True)
class InterviewQuestion:
    question_id: str
    skill: str
    prompt: str
    rubric: tuple[RubricConcept, ...]


INTERVIEW_QUESTIONS = {
    "AWS": InterviewQuestion(
        question_id="aws-least-privilege",
        skill="AWS",
        prompt="How would you give an application access to one AWS resource without sharing a personal access key?",
        rubric=(
            RubricConcept("Use an IAM role", ("iam role", "role")),
            RubricConcept("Apply least privilege", ("least privilege", "minimum permissions")),
            RubricConcept("Avoid long-lived keys", ("temporary credentials", "no access key", "short-lived credentials")),
        ),
    ),
    "Communication": InterviewQuestion(
        question_id="communication-conflict",
        skill="Communication",
        prompt="Tell me about a time you disagreed with a teammate. How did you handle it?",
        rubric=(
            RubricConcept("Give a specific situation", ("specific example", "situation", "context")),
            RubricConcept("Explain how you listened or collaborated", ("listened", "asked questions", "collaborated", "shared perspectives")),
            RubricConcept("Describe an outcome or lesson", ("outcome", "result", "learned", "lesson")),
        ),
    ),
    "Data Analysis": InterviewQuestion(
        question_id="data-analysis-missing-values",
        skill="Data Analysis",
        prompt="A dataset has missing values in an important column. How would you decide what to do before analyzing it?",
        rubric=(
            RubricConcept("Measure missingness", ("missing values", "missingness", "null count", "percentage missing")),
            RubricConcept("Investigate why values are missing", ("why missing", "missing mechanism", "data collection")),
            RubricConcept("Choose and validate a treatment", ("impute", "remove rows", "sensitivity analysis", "compare results")),
        ),
    ),
    "Docker": InterviewQuestion(
        question_id="docker-image-container",
        skill="Docker",
        prompt="What is the difference between a Docker image and a container, and how would you keep an image small?",
        rubric=(
            RubricConcept("Image is a template and container is a running instance", ("image template", "container instance", "running instance")),
            RubricConcept("Use a small base image", ("slim base image", "small base image", "alpine")),
            RubricConcept("Reduce layers or use multi-stage builds", ("multi-stage", "multi stage", "combine layers")),
        ),
    ),
    "FastAPI": InterviewQuestion(
        question_id="fastapi-request-validation",
        skill="FastAPI",
        prompt="How would you validate an incoming JSON request and return a clear error for invalid data in FastAPI?",
        rubric=(
            RubricConcept("Define a Pydantic request model", ("pydantic model", "request model", "basemodel")),
            RubricConcept("Declare field constraints or validators", ("field constraint", "field validator", "validator")),
            RubricConcept("Use an appropriate HTTP error response", ("422", "http exception", "status code")),
        ),
    ),
    "Git": InterviewQuestion(
        question_id="git-merge-rebase",
        skill="Git",
        prompt="How does rebasing differ from merging, and when would you avoid rebasing a branch?",
        rubric=(
            RubricConcept("Merge preserves branch history with a merge commit", ("merge commit", "preserves history", "merge combines")),
            RubricConcept("Rebase replays commits on a new base", ("replays commits", "new base", "linear history")),
            RubricConcept("Avoid rewriting shared published history", ("shared branch", "published commits", "rewrites history")),
        ),
    ),
    "Generative AI": InterviewQuestion(
        question_id="genai-hallucinations",
        skill="Generative AI",
        prompt="A language model gives a confident but unsupported answer. How would you reduce this risk and verify the result?",
        rubric=(
            RubricConcept("Ground responses in trusted context", ("ground", "retrieved context", "source documents")),
            RubricConcept("Make uncertainty or limitations clear", ("uncertainty", "say it does not know", "limitations")),
            RubricConcept("Evaluate outputs against representative examples", ("evaluation set", "test cases", "human review")),
        ),
    ),
    "Machine Learning": InterviewQuestion(
        question_id="ml-overfitting",
        skill="Machine Learning",
        prompt="A model scores very well on training data but poorly on unseen data. What might be happening, and what would you try?",
        rubric=(
            RubricConcept("Identify overfitting", ("overfit", "overfitting")),
            RubricConcept("Use a validation set or cross-validation", ("validation set", "cross-validation", "cross validation")),
            RubricConcept("Reduce complexity or regularize", ("regularization", "regularisation", "simpler model", "reduce complexity")),
        ),
    ),
    "Python": InterviewQuestion(
        question_id="python-mutable-default",
        skill="Python",
        prompt="Why can using a list as a Python function's default argument cause surprising behavior, and how do you avoid it?",
        rubric=(
            RubricConcept("Defaults are created once when the function is defined", ("defined", "function definition", "evaluated once")),
            RubricConcept("The same mutable object is reused across calls", ("mutable", "shared", "same list")),
            RubricConcept("Use None and create a fresh list inside the function", ("none sentinel", "default to none", "new list")),
        ),
    ),
    "RAG": InterviewQuestion(
        question_id="rag-retrieval-quality",
        skill="RAG",
        prompt="A retrieval-augmented system returns irrelevant passages. How would you diagnose and improve retrieval quality?",
        rubric=(
            RubricConcept("Inspect chunking and source document quality", ("chunk size", "chunking", "document quality")),
            RubricConcept("Measure retrieval relevance", ("precision", "recall", "relevance", "top-k")),
            RubricConcept("Tune embeddings, filters, or reranking", ("rerank", "reranking", "embedding model", "metadata filter")),
        ),
    ),
    "React": InterviewQuestion(
        question_id="react-state",
        skill="React",
        prompt="In React, when should component data be state, and what happens when that state changes?",
        rubric=(
            RubricConcept("State is data that changes over time", ("changes over time", "changing data", "state changes")),
            RubricConcept("Update state through the state setter", ("state setter", "setstate", "state update")),
            RubricConcept("React renders the component again", ("rerender", "re-render", "render again")),
        ),
    ),
    "SQL": InterviewQuestion(
        question_id="sql-index-tradeoff",
        skill="SQL",
        prompt="How can an index speed up a database query, and what cost does an index add?",
        rubric=(
            RubricConcept("An index speeds up lookups or filtering", ("lookup", "filter", "faster search", "query plan")),
            RubricConcept("Indexes consume storage", ("storage", "disk space")),
            RubricConcept("Indexes add work to writes or updates", ("slower writes", "insert overhead", "update overhead")),
        ),
    ),
    "Statistics": InterviewQuestion(
        question_id="statistics-confidence-interval",
        skill="Statistics",
        prompt="What does a 95% confidence interval communicate, and what does it not mean?",
        rubric=(
            RubricConcept("The method has 95% long-run coverage", ("repeated samples", "long-run", "long run")),
            RubricConcept("It describes uncertainty around an estimate", ("uncertainty", "range of plausible", "estimate")),
            RubricConcept("It is not a 95% probability that this fixed interval contains the parameter", ("not probability", "fixed parameter", "not 95% chance")),
        ),
    ),
}


MAX_INTERVIEW_QUESTIONS = 5


def select_questions(skills: Sequence[str]) -> list[InterviewQuestion]:
    selected_skills = list(dict.fromkeys(skills))
    if not selected_skills:
        raise ValueError("Select at least one supported interview skill.")

    unsupported_skills = [
        skill for skill in selected_skills if skill not in INTERVIEW_QUESTIONS
    ]
    if unsupported_skills:
        raise ValueError(
            "No interview question is available for: "
            + ", ".join(unsupported_skills)
        )

    return [
        INTERVIEW_QUESTIONS[skill]
        for skill in selected_skills[:MAX_INTERVIEW_QUESTIONS]
    ]
