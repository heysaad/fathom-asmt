export interface ShipVM {
    id: string;
    name: string;
    imo: string;
    type?: string;
    description?: string;
}

export interface MaintenanceRecord {
    id: string;
    shipId?: string;
    title: string;
    description?: string;
    type: "routine" | "repair" | "inspection" | "upgrade";
    status: "scheduled" | "in_progress" | "completed";
    dueDate?: string;
}