export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  status?: TaskStatus;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

export interface TaskQueryParams {
  limit?: number;
  offset?: number;
  status?: TaskStatus;
}



