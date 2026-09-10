export type VentureStatus = "New"|"Evaluation"|"Review"|"Active"|"Closed";
export type FollowUpStatus = "pending"|"completed"|"overdue";
export type TaskStatus = "pending"|"completed";

export interface Venture {
  _id: string;
  name: string;
  founderName: string;
  founderEmail: string;
  industry: string;
  status: VentureStatus;
  followUpDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  followUp?: FollowUp | null;
}
export interface FollowUp {
  _id: string;
  ventureId: string | Venture;
  dueDate: string;
  status: FollowUpStatus;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
export interface Task {
  _id: string;
  ventureId: string;
  title: string;
  status: TaskStatus;
  dueDate?: string | null;
  createdAt: string;
  completedAt?: string | null;
}
export interface Activity {
  _id: string;
  ventureId?: string | null;
  ventureName?: string;
  action: string;
  description: string;
  createdAt: string;
}
export interface DashboardStats {
  totalVentures: number;
  pendingFollowUps: number;
  todaysFollowUps: number;
  overdueFollowUps: number;
  completedFollowUps: number;
}
