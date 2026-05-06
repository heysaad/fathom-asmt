# Fathom Marine Assessment

## Software Developer Assessment: Maritime Operations & Compliance System

---

## Context
You are building a platform for a marine organization to manage:

- Ship maintenance activities  
- Safety drills and crew participation  
- Compliance monitoring across ships  

The system should help ensure that ships are operationally safe and compliant with regulations.

---

## Objective
Build a full-stack application where:

- Admins manage maintenance tasks and safety drills  
- Crew members participate and log activities  
- The system tracks compliance and highlights risks  

---

## Tech Stack (Flexible)

### Frontend
- React (TypeScript preferred)

### Backend
- Node.js / FastAPI / Spring Boot / Django

### Database
- PostgreSQL / MongoDB

---

## Core Features

### 🔹 1. Ship Maintenance Module

#### Admin should be able to:
- Create maintenance tasks for ships  
- Assign tasks to crew  
- Update task status:
  - Pending  
  - In Progress  
  - Completed  

#### Crew should be able to:
- View assigned tasks  
- Update status  
- Add notes/comments  

---

### 🔹 2. Safety Drill Management

#### Admin:
- Schedule safety drills (e.g., fire drill, evacuation)  
- Assign drills to ships  

#### Crew:
- View upcoming drills  
- Mark attendance  
- Submit drill completion  

---

### 🔹 3. Compliance Dashboard

#### System should show:
- Pending maintenance tasks  
- Missed drills  
- Completed vs pending activities  

#### System should highlight:
- Overdue maintenance  
- Missed safety drills  

---

## Business Rules
- A maintenance task has a due date  
- A drill has a scheduled date  
- If not completed on time → marked as non-compliant  

### Compliance is calculated based on:
- Completed maintenance %  
- Drill participation %  

---

## Frontend Expectations
- Dashboard showing:
  - Maintenance summary  
  - Drill summary  
  - Compliance status  

### Pages:
- Maintenance management  
- Drill management  
- Crew dashboard  

---

## Bonus Features
- Role-based access control  
- Filters (by ship, status, date)  
- Notifications (overdue tasks)  
- Charts for compliance (basic graphs)  
- Docker setup  
- Deployment  

---

## Evaluation Criteria

### Technical
- API design  
- DB schema  
- Code structure  

### Logic
- Compliance calculation  
- Handling overdue/missed cases  

### Frontend
- UI clarity  
- Data visualization  

### System Thinking
- Scalability  
- Clean separation of concerns  

---

## Submission Requirements
- GitHub repo  
- Business Flow of the application (DOCS/PDF)  
- README with:
  - Setup steps  
  - Architecture decisions  
- Deployed link  