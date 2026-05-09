import { UserVM } from "../admin/users/models";

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
    assignedToId?: string
    assignedTo?: UserVM
}

export interface ShipCrewAssignment {
    id: string;
    ship_id: string;
    crew_member_id: string;
    is_active: boolean;
    created_at: string;
    crew_member?: UserVM;
}