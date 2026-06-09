import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ProgressLog, TaskWithDetails } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getWeekDates(pivotDate: Date, startOfWeek: "sun" | "mon" = "mon") {
  const dates = [];
  const currentDay = pivotDate.getDay();

  let distance = 0;
  if (startOfWeek === "mon") {
    distance = currentDay === 0 ? -6 : 1 - currentDay;
  } else {
    distance = -currentDay;
  }

  const startOfWeekDate = new Date(pivotDate);
  startOfWeekDate.setDate(pivotDate.getDate() + distance);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeekDate);
    d.setDate(startOfWeekDate.getDate() + i);
    const dayIndex = d.getDay();
    dates.push({
      dayName: dayNames[dayIndex],
      dateStr: formatDate(d),
      dateNum: d.getDate(),
      dayIndex,
    });
  }

  return dates;
}

export function buildTaskTree(tasks: any[], logs: ProgressLog[]): TaskWithDetails[] {
  const taskMap: { [id: string]: TaskWithDetails } = {};

  tasks.forEach((task) => {
    taskMap[task.id] = {
      ...task,
      subtasks: [],
      progressLogs: logs.filter((log) => log.taskId === task.id),
    };
  });

  const roots: TaskWithDetails[] = [];

  tasks.forEach((task) => {
    const node = taskMap[task.id];
    if (task.parentId) {
      const parent = taskMap[task.parentId];
      if (parent) {
        parent.subtasks.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  const sortTree = (nodes: TaskWithDetails[]): TaskWithDetails[] => {
    return nodes
      .sort((a, b) => a.order - b.order)
      .map((node) => {
        if (node.subtasks.length > 0) {
          node.subtasks = sortTree(node.subtasks);
        }
        return node;
      });
  };

  return sortTree(roots);
}

export function calculateStreak(logs: ProgressLog[]): number {
  const completedDates = Array.from(
    new Set(
      logs
        .filter((log) => log.completed)
        .map((log) => log.date)
    )
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (completedDates.length === 0) return 0;

  const todayStr = formatDate(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  const firstCompleted = completedDates[0];
  if (firstCompleted !== todayStr && firstCompleted !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let expectedDate = new Date(firstCompleted);

  for (let i = 0; i < completedDates.length; i++) {
    const dateStr = completedDates[i];
    const expectedStr = formatDate(expectedDate);

    if (dateStr === expectedStr) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
