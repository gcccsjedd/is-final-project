export function validateTasks(tasks: { description: string; deadline: string; category: string; urgency: string }[]) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
        return { error: "Invalid task data. Please provide an array of tasks." };
    }
    for (const task of tasks) {
        if (!task.description || !task.deadline || !task.category || !task.urgency) {
            return { error: "Each task must include description, deadline, category, and urgency." };
        }
    }
    return null;
}
