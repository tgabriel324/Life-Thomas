export interface Project {
  id: number;
  name: string;
  description: string;
  color: string;
}

export interface Todo {
  id: number;
  text: string;
  completed: number;
  position: number;
  project_id: number | null;
  due_date: string | null;
}
