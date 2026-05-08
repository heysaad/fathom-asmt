export interface TaskVM{
    id: string
    status: "scheduled" | "in_progress" | "completed"
    description: string
    dueDate: string
    title: string
}