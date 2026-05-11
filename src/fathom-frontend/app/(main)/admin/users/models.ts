export interface UserVM {
  id: string;
  name: string | null;
  email: string;
  designation: string | null;
  role: "admin" | "crew";
}

export interface UserActivitySummaryVM {
  assigned_ships: number;
  active_ship_assignments: number;
  scheduled_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  drills_created: number;
}

export interface UserShipAssignmentVM {
  id: string;
  ship_id: string;
  ship: {
    id: string;
    name: string;
    imo: string | null;
    description: string | null;
    type: string;
    created_at: string;
    compliance_score: number | null;
  } | null;
  is_active: boolean | null;
  created_at: string | null;
  drills_total: number | null;
  drills_attended: number | null;
  tasks_total: number | null;
  tasks_completed: number | null;
  compliance_score: number | null;
}

export interface UserDetailsVM extends UserVM {
  created_at: string | null;
  summary: UserActivitySummaryVM;
  ship_assignments: UserShipAssignmentVM[];
}
