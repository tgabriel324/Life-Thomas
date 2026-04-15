export interface Project {
  id: number;
  name: string;
  description: string;
  color: string;
}

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  position: number;
  projectId: number | null;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: number | null;
  goalId: number | null;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  specialty: string | null;
  email: string | null;
  whatsapp: string | null;
  avatar: string | null;
  status: 'available' | 'focused' | 'busy';
}

export interface Objective {
  id: number;
  title: string;
  description: string | null;
  status: 'active' | 'completed' | 'on_hold';
}

export interface Goal {
  id: number;
  objectiveId: number;
  title: string;
  targetValue: string | null;
  currentValue: string;
  deadline: string | null;
  status: 'active' | 'completed';
}

export interface TodoAttachment {
  id: number;
  todoId: number;
  type: string;
  content: string;
  metadata: any;
  createdAt: string;
}
