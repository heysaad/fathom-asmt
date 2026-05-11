import { MaintenanceRecord } from "../(main)/ships/models";
import { UserInfo } from "./user-context";

export const canAddTask = (user?: UserInfo) => {
  return user?.role == "admin";
};

export const canEditTask = (task: MaintenanceRecord, user?: UserInfo) => {
  if (user == null) return false;
  if (user.role == "admin") return true;
  return task.assignedToId == user.id && task.status != "completed";
};

export const canDeleteTask = (task: MaintenanceRecord, user?: UserInfo) => {
  return user?.role == "admin";
};

export const canEditCrewAsst = (user?: UserInfo) => {
  return user?.role == "admin";
};

export const canAddDrill = (user?: UserInfo) => {
  return user?.role == "admin";
};

export const canEditDrill = (user?: UserInfo) => {
  return user?.role == "admin";
};
