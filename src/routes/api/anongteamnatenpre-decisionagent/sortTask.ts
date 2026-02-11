import { PRIORITY_LEVELS } from "./constant";

export function sortTasks(tasks: { description: string; deadline: string; category: string; urgency: string }[]) {
    return tasks
        .sort((a, b) => {
            const urgencyA = PRIORITY_LEVELS[a.urgency.toLowerCase() as keyof typeof PRIORITY_LEVELS] || 1;
            const urgencyB = PRIORITY_LEVELS[b.urgency.toLowerCase() as keyof typeof PRIORITY_LEVELS] || 1;

            const deadlineA = new Date(a.deadline).getTime();
            const deadlineB = new Date(b.deadline).getTime();

            // Sort by urgency first, then by deadline
            return urgencyB - urgencyA || deadlineA - deadlineB;
        })
        .map(task => ({
            ...task,
            priority: determinePriority(task.urgency.toLowerCase() as keyof typeof PRIORITY_LEVELS)
        }));
}

function determinePriority(urgency: keyof typeof PRIORITY_LEVELS): string {
    const urgencyLevel = PRIORITY_LEVELS[urgency.toLowerCase() as keyof typeof PRIORITY_LEVELS] || 1;
    if (urgencyLevel >= 3) return "High";
    if (urgencyLevel >= 2) return "Medium";
    return "Low";
}