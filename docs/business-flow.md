# Business Flow

This document describes the main operational flow for Fathom Marine Assessment, from admin setup through crew execution and compliance monitoring.

## Actors

- **Admin:** Manages ships, users, crew assignments, maintenance tasks, safety drills, and compliance review.
- **Crew:** Views assigned work, updates maintenance progress, and records drill attendance or completion.

## End-to-End Flow

```mermaid
flowchart TD
    A["Admin signs in"] --> B["Review operations dashboard"]
    B --> C["Create or update ships"]
    C --> D["Assign crew to ships"]
    D --> E["Create maintenance tasks"]
    D --> F["Schedule safety drills"]
    E --> G["Crew signs in"]
    F --> G
    G --> H["Crew views assigned tasks and drills"]
    H --> I["Update task status and notes"]
    H --> J{"Drill status is InProgress?"}
    J -->|Yes| M["Mark drill attendance"]
    J -->|No| N["Attendance is blocked"]
    I --> K["Compliance service recalculates scores"]
    M --> K
    K --> L["Admin reviews overdue work, missed drills, and risk"]
```

1. Admin signs in and reviews the operations dashboard.
2. Admin creates or updates ships in the ship registry.
3. Admin assigns crew members to ships.
4. Admin creates maintenance tasks with due dates, priority, status, and assigned crew members.
5. Admin schedules safety drills for ships and assigns required crew participation.
6. Crew members sign in to their dashboard.
7. Crew members see only their assigned maintenance tasks and drills.
8. Crew updates maintenance task status as work moves from pending to in progress to completed.
9. Crew adds notes or comments to maintenance tasks when updates need supporting context.
10. Crew marks drill attendance only after the drill has started and its status is `InProgress`.
11. The backend recalculates compliance after maintenance and drill changes.
12. Admin monitors overdue maintenance, missed drills, pending activity, and compliance scores.
13. Admin uses compliance insights to follow up on risky ships, incomplete work, or missed safety activity.

## Maintenance Flow

```mermaid
stateDiagram-v2
    [*] --> Pending: Admin creates task
    Pending --> InProgress: Crew starts work
    InProgress --> Completed: Crew completes task
    Pending --> Overdue: Due date passes
    InProgress --> Overdue: Due date passes
    Overdue --> Completed: Crew completes late task
    Completed --> [*]
```

```text
Admin creates task
  -> Task assigned to ship and crew member
  -> Crew views assigned task
  -> Crew updates status and notes
  -> Completed tasks improve compliance
  -> Overdue incomplete tasks reduce compliance
```

## Safety Drill Flow

```mermaid
sequenceDiagram
    participant Admin
    participant API
    participant Crew
    participant Compliance

    Admin->>API: Schedule drill for ship
    Admin->>API: Assign crew participation
    Crew->>API: View upcoming drills
    Crew->>API: Request attendance mark
    API->>API: Check drill status
    alt Drill status is InProgress
        API-->>Crew: Attendance accepted
        API->>Compliance: Refresh drill compliance
        Compliance-->>API: Updated score
        API-->>Admin: Dashboard shows drill status
    else Drill has not started
        API-->>Crew: Attendance rejected
    end
```

```text
Admin schedules drill
  -> Drill assigned to ship and crew
  -> Crew views upcoming drill
  -> Drill status moves to InProgress when started
  -> Crew marks attendance only while drill is InProgress
  -> Completed participation improves compliance
  -> Missed drills reduce compliance
```

## Compliance Flow

Compliance is driven by maintenance completion and drill participation. When task or drill data changes, the backend refreshes compliance scores so admin dashboards can highlight operational risk.

```mermaid
flowchart LR
    A["Maintenance tasks"] --> C["Compliance service"]
    B["Safety drill participation"] --> C
    C --> D["Crew compliance score"]
    C --> E["Ship compliance score"]
    D --> F["Dashboard risk indicators"]
    E --> F
    F --> G["Admin follow-up actions"]
```

```text
Maintenance activity + Drill activity
  -> Compliance service recalculation
  -> Ship and crew compliance scores
  -> Dashboard risk visibility
```
