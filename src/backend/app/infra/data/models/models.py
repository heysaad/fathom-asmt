from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import uuid4

class User(BaseModel):
    id: str = Field(default_factory=uuid4, alias="_id")
    name: str
    email: str
    password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Ship(BaseModel):
    id: str = Field(default_factory=uuid4, alias="_id")
    name: str
    type: str
    tasks: List[ShipTask] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ShipTask(BaseModel):
    id: str = Field(default_factory=uuid4, alias="_id")
    name: str
    description: Optional[str] = None
    assigned_to: Optional[str] = None  # User ID
    status: str = "pending"  # pending, in_progress, completed
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TaskHistory(BaseModel):
    id: str = Field(default_factory=uuid4, alias="_id")
    task_id: str  # ShipTask ID
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class TaskComment(BaseModel):
    id: str = Field(default_factory=uuid4, alias="_id")
    task_id: str  # ShipTask ID
    user_id: str  # User ID
    comment: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TaskNote(BaseModel):
    id: str = Field(default_factory=uuid4, alias="_id")
    task_id: str  # ShipTask ID
    user_id: str  # User ID
    note: str
    created_at: datetime = Field(default_factory=datetime.utcnow)