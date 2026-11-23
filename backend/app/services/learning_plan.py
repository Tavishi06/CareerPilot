from collections.abc import Sequence

from app.services.learning_resources import LEARNING_RESOURCES


def _order_by_prerequisites(skills: Sequence[str]) -> list[str]:
    selected = set(skills)
    ordered = []
    visiting = set()
    visited = set()

    def visit(skill: str) -> None:
        if skill in visited:
            return
        if skill in visiting:
            raise ValueError(f"Learning resource prerequisites contain a cycle at {skill}.")

        visiting.add(skill)
        for prerequisite in LEARNING_RESOURCES[skill].prerequisites:
            if prerequisite in selected:
                visit(prerequisite)
        visiting.remove(skill)
        visited.add(skill)
        ordered.append(skill)

    for skill in skills:
        visit(skill)

    return ordered


def build_learning_plan(
    missing_skills: Sequence[str], weekly_hours: int = 5
) -> dict[str, object]:
    if weekly_hours < 1:
        raise ValueError("Weekly study hours must be at least 1.")

    unique_skills = list(dict.fromkeys(missing_skills))
    unsupported_skills = [
        skill for skill in unique_skills if skill not in LEARNING_RESOURCES
    ]
    if unsupported_skills:
        raise ValueError(
            "No learning resource is available for: "
            + ", ".join(unsupported_skills)
        )

    ordered_skills = _order_by_prerequisites(unique_skills)
    milestones = []
    elapsed_hours = 0

    for sequence, skill in enumerate(ordered_skills, start=1):
        resource = LEARNING_RESOURCES[skill]
        start_week = elapsed_hours // weekly_hours + 1
        elapsed_hours += resource.estimated_hours
        target_week = (elapsed_hours - 1) // weekly_hours + 1
        milestones.append(
            {
                "sequence": sequence,
                "skill": skill,
                "title": resource.title,
                "url": resource.url,
                "objective": resource.objective,
                "estimated_hours": resource.estimated_hours,
                "start_week": start_week,
                "target_week": target_week,
            }
        )

    return {
        "weekly_hours": weekly_hours,
        "total_hours": elapsed_hours,
        "duration_weeks": (elapsed_hours + weekly_hours - 1) // weekly_hours,
        "milestones": milestones,
    }
