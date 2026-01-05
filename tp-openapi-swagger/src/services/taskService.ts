import { v4 as uuidv4 } from 'uuid';
import { Task, TaskCreate, TaskUpdate, TaskStatus, TaskQueryParams } from '../types/task';

/**
 * Service de gestion des tâches (stockage en mémoire)
 */
class TaskService {
  private tasks: Task[] = [];

  /**
   * Récupère toutes les tâches avec pagination et filtres
   */
  findAll(params: TaskQueryParams): { tasks: Task[]; total: number } {
    let filtered = [...this.tasks];

    // Filtre par status si fourni
    if (params.status) {
      filtered = filtered.filter((task) => task.status === params.status);
    }

    const total = filtered.length;

    // Pagination
    const offset = params.offset || 0;
    const limit = params.limit || 10;
    const paginated = filtered.slice(offset, offset + limit);

    return { tasks: paginated, total };
  }

  /**
   * Récupère une tâche par son ID
   */
  findById(id: string): Task | undefined {
    return this.tasks.find((task) => task.id === id);
  }

  /**
   * Crée une nouvelle tâche
   */
  create(data: TaskCreate): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: uuidv4(),
      title: data.title,
      description: data.description,
      status: data.status || 'todo',
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.push(task);
    return task;
  }

  /**
   * Met à jour complètement une tâche (PUT)
   */
  update(id: string, data: TaskUpdate): Task | null {
    const task = this.findById(id);
    if (!task) {
      return null;
    }

    const updated: Task = {
      ...task,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const index = this.tasks.findIndex((t) => t.id === id);
    this.tasks[index] = updated;

    return updated;
  }

  /**
   * Met à jour partiellement une tâche (PATCH)
   */
  patch(id: string, data: Partial<TaskUpdate>): Task | null {
    const task = this.findById(id);
    if (!task) {
      return null;
    }

    const updated: Task = {
      ...task,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const index = this.tasks.findIndex((t) => t.id === id);
    this.tasks[index] = updated;

    return updated;
  }

  /**
   * Supprime une tâche
   */
  delete(id: string): boolean {
    const index = this.tasks.findIndex((task) => task.id === id);
    if (index === -1) {
      return false;
    }

    this.tasks.splice(index, 1);
    return true;
  }
}

export const taskService = new TaskService();


