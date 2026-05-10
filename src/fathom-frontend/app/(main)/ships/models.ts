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

export interface Drill {
    id: string;
    ship_id: string;
    type: "fire_drill" | "evacuation" | "man_overboard";
    title?: string;
    scheduled_at: string;
    started_at?: string;
    completed_at?: string;
    status: "scheduled" | "in_progress" | "completed" | "missed" | "cancelled";
    notes?: string;
    created_by?: string;
    created_at: string;
}

export interface DrillAssignment {
    id: string;
    drill_id: string;
    ship_crew_assignment_id: string;
    assigned_at: string;
    is_attended: boolean;
    is_completed: boolean;
    attended_at?: string;
    remarks?: string;
    crew_member?: UserVM
}