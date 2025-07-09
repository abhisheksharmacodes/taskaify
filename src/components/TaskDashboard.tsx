"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { Pencil1Icon, TrashIcon, CheckIcon, Cross2Icon, PlusIcon } from '@radix-ui/react-icons';
import { z } from 'zod';
import TaskSubtasks from './TaskSubtasks';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import Snackbar from "./Snackbar";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

const taskSchema = z.object({
  content: z.string().min(1, 'Task cannot be empty').max(255, 'Task too long'),
  category: z.string().max(50, 'Category too long').optional(),
});
const updateTaskSchema = z.object({
  content: z.string().min(1, 'Task cannot be empty').max(255, 'Task too long').optional(),
  category: z.string().max(50, 'Category too long').optional(),
  completed: z.boolean().optional(),
});

// Define a Task type at the top of the file
type Task = {
  id: number;
  userId?: number;
  content: string;
  completed: boolean;
  category?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-red-600 p-4 bg-red-50 rounded">Something went wrong.</div>;
    }
    return this.props.children;
  }
}

type ThemedDatePickerProps = {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  className?: string;
};

// Calendar icon SVG
const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5 text-gray-400"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3.75 7.5h16.5M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h10.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75a2.25 2.25 0 0 1-2.25-2.25V6.75z"
    />
  </svg>
);

function ThemedDatePicker({ value, onChange, minDate, className }: ThemedDatePickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative w-full">
      <input
        readOnly
        value={value || ''}
        onClick={() => setOpen((v) => !v)}
        placeholder="DD-MM-YYYY"
        className={`w-full px-3 py-[6px] text-sm border rounded-md cursor-pointer bg-transparent pr-10 font-normal ${className || ''}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setOpen((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-0 m-0 bg-transparent border-none cursor-pointer"
        aria-label="Open calendar"
        style={{ outline: 'none' }}
      >
        <CalendarIcon />
      </button>
      {open && (
        <div className="absolute z-50 bg-white border rounded shadow mt-1">
          <DayPicker
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(date: Date | undefined) => {
              setOpen(false);
              onChange(date ? date.toISOString().slice(0, 10) : '');
            }}
            fromDate={minDate ? new Date(minDate) : undefined}
            modifiersClassNames={{
              selected: 'bg-blue-600 text-white',
              today: 'border-blue-600',
            }}
            className="p-2"
          />
        </div>
      )}
    </div>
  );
}

function TaskDashboard() {
  const { token } = useAuth();
  const [topic, setTopic] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState<string[]>([]);
  const [savedTasks, setSavedTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState({ total: 0, completed: 0, progress: 0 });
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generatedTaskLoading, setGeneratedTaskLoading] = useState<{ [key: number]: boolean }>({});
  const [savedTaskLoading, setSavedTaskLoading] = useState<{ [key: number]: string | null }>({});
  const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  // Edit state
  const [editTaskId, setEditTaskId] = useState<number | null>(null);
  const [editTaskContent, setEditTaskContent] = useState('');
  const [editTaskCategory, setEditTaskCategory] = useState('');
  // State for per-generated-task category
  const [generatedTaskCategories, setGeneratedTaskCategories] = useState<{ [key: number]: string }>({});
  const [generatedTaskDueDates, setGeneratedTaskDueDates] = useState<{ [key: number]: string }>({});
  // Edit state
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  // Modal state for creating category
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [createCategoryLoading, setCreateCategoryLoading] = useState(false);
  // Add this state near the other useState hooks
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<{ [taskId: number]: string }>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const isFirstLoad = useRef(true);
  const [saveAllLoading, setSaveAllLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<number | null>(null);
  // Add state to store all tasks
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [catFetched, setCatFetched] = useState(false)
  const [usedCategories, setUsedCategories] = useState<string[]>([])
  const [showIntro,setShowIntro] = useState(false)

  // Helper to get today's date in yyyy-mm-dd format
  const todayStr = new Date().toISOString().slice(0, 10);

  // Helper to fetch subtask counts for all tasks
  const useSubtaskCounts = (tasks: Task[], token: string): { [key: number]: number } => {
    const [counts, setCounts] = useState<{ [key: number]: number }>({});
    useEffect(() => {
      if (!token || !tasks.length) return;
      (async () => {
        const newCounts: { [key: number]: number } = {};
        await Promise.all(tasks.map(async (task: Task) => {
          const res = await fetch(`/api/tasks/${task.id}/subtasks`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const subtasks = await res.json();
            newCounts[task.id] = subtasks.length;
          } else {
            newCounts[task.id] = 0;
          }
        }));
        setCounts(newCounts);
      })();
    }, [tasks, token]);
    return counts;
  };

  // Fetch categories
  const fetchCategories = useCallback(() => {
    if (!token) return;
    fetch('/api/tasks/categories', { headers: { Authorization: `Bearer ${token}` } })
      .then(async res => {
        if (!res.ok) return [];
        const text = await res.text();
        if (!text) return [];
        return JSON.parse(text);
      })
      .then(cats => {
        const uniqueCats = Array.from(new Set(['general', ...cats]));
        setCategories(uniqueCats.length > 0 ? uniqueCats : ['general']);
      })
      .catch(() => setCategories(['general']));
  }, [token]);

  // Create/update user with name
  const createUserWithName = useCallback(() => {
    if (!token) return;
    const userName = localStorage.getItem('userName');
    if (userName) {
      // First try to update existing user with PUT
      fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: userName }),
      }).then((res) => {
        if (res.ok) {
          // Remove the name from localStorage after successful update
          localStorage.removeItem('userName');
        } else if (res.status === 404) {
          // User doesn't exist, create with POST
          return fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name: userName }),
          });
        }
      }).then((res) => {
        if (res && res.ok) {
          // Remove the name from localStorage after successful creation
          localStorage.removeItem('userName');
        }
      }).catch(err => {
        console.error('Failed to create/update user with name:', err);
      });
    }
  }, [token]);

  // Fetch saved tasks and progress (with category filter)
  const fetchTasksAndProgress = () => {
    if (!token) return;
    if (isFirstLoad.current) {
      setInitialLoading(true); // Only show skeleton on first load
    }
    let url = '/api/tasks';
    if (selectedCategory) {
      url += `?category=${encodeURIComponent(selectedCategory)}`;
    }
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(async res => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || 'API error');
        }
        const text = await res.text();
        if (!text) {
          throw new Error('Empty response from API');
        }
        return JSON.parse(text);
      })
      .then(data => {
        console.log(data)
        setSavedTasks(data);
        setAllTasks(data);  // all tasks (unfiltered reference)
        setInitialLoading(false); // Hide skeleton after first fetch
        if (!showIntro)
          setShowIntro(!data.length)
        isFirstLoad.current = false; // Mark as not first load anymore
      })
      .catch(err => {
        showNotification({ message: 'Failed to fetch tasks: ' + (err.message || err), type: 'error' });
      });
    fetch('/api/tasks/progress', { headers: { Authorization: `Bearer ${token}` } })
      .then(async res => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || 'API error');
        }
        const text = await res.text();
        if (!text) {
          throw new Error('Empty response from API');
        }
        return JSON.parse(text);
      })
      .then(setProgress)
      .catch(err => {
        showNotification({ message: 'Failed to fetch progress: ' + (err.message || err), type: 'error' });
      });
  };

  useEffect(() => {
    fetchCategories();
  }, [token, savedTasks, fetchCategories]);

  useEffect(() => {
    createUserWithName();
    fetchTasksAndProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedCategory]);

  useEffect(() => {
    if (snackbarVisible) {
      const timer = setTimeout(() => setSnackbarVisible(false), 3000); // 3 seconds
      return () => clearTimeout(timer);
    }
  }, [snackbarVisible]);

  // Generate tasks using Gemini
  const handleGenerate = async () => {
    setGenerateLoading(true);
    setSnackbar(null);
    setGeneratedTasks([]);
    try {
      const res = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic, category: selectedCategory }),
      });
      if (!res.ok) {
        throw new Error('API error');
      }
      const text = await res.text();
      if (!text) {
        throw new Error('Empty response from API');
      }
      const data = JSON.parse(text);
      if (data.tasks === false || (Array.isArray(data.tasks) && data.tasks.length === 0)) {
        setSnackbar({ message: "Try something else", type: 'error' });
        setSnackbarVisible(true);
        setGenerateLoading(false);
        return;
      }
      if (data.tasks) {
        setGeneratedTasks(data.tasks);
        // Set default category to 'general' for each generated task
        const defaultCategories: { [key: number]: string } = {};
        data.tasks.forEach((_: any, i: number) => {
          defaultCategories[i] = 'general';
        });
        setGeneratedTaskCategories(defaultCategories);
        setGeneratedTaskDueDates({});
        setSnackbar({ message: 'Tasks generated!', type: 'success' });
        setSnackbarVisible(true);
        fetchTasksAndProgress();
        setShowIntro(false)
        fetchCategories();
      }
      else {
        setSnackbar({ message: data.error || 'Failed to generate tasks', type: 'error' });
        setSnackbarVisible(true);
      }
    } catch (e: any) {
      console.log('Gemini API error:', e); // Log all errors including resource exhausted
      setSnackbar({ message: e.message, type: 'error' });
      setSnackbarVisible(true);
    } finally {
      setGenerateLoading(false);
    }
  };

  // Save a generated task
  const handleSaveTask = async (content: string, index: number) => {
    if (!token) return;
    const taskCategory = generatedTaskCategories[index] || '';
    const dueDate = generatedTaskDueDates[index] ? new Date(generatedTaskDueDates[index]).toISOString() : undefined;
    const result = taskSchema.safeParse({ content, category: taskCategory });
    if (!result.success) {
      setSnackbar({ message: result.error.errors[0].message, type: 'error' });
      setSnackbarVisible(true);
      return;
    }
    setGeneratedTaskLoading(prev => ({ ...prev, [index]: true }));
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, category: taskCategory, dueDate }),
      });
      setGeneratedTasks(prevTasks => {
        const newTasks = prevTasks.filter((_, i) => i !== index);
        // Rebuild categories to match new indices
        const newCategories: { [key: number]: string } = {};
        const newDueDates: { [key: number]: string } = {};
        newTasks.forEach((_, newIdx) => {
          const oldIdx = newIdx < index ? newIdx : newIdx + 1;
          newCategories[newIdx] = generatedTaskCategories[oldIdx] || 'general';
          newDueDates[newIdx] = generatedTaskDueDates[oldIdx] || '';
        });
        setGeneratedTaskCategories(newCategories);
        setGeneratedTaskDueDates(newDueDates);
        // If all generated tasks are now saved, clear the topic field
        if (newTasks.length === 0) setTopic('');
        return newTasks;
      });
      await fetchTasksAndProgress();
      await fetchCategories();
      setSnackbar({ message: 'Task saved!', type: 'success' });
      setSnackbarVisible(true);
    } catch (e: any) {
      setSnackbar({ message: e.message, type: 'error' });
      setSnackbarVisible(true);
    } finally {
      setGeneratedTaskLoading(prev => {
        const copy = { ...prev };
        delete copy[index];
        return copy;
      });
    }
  };

  // Toggle complete/incomplete (optimistic UI)
  const handleToggleComplete = async (task: Task) => {
    if (!token) return;
    setSavedTaskLoading(prev => ({ ...prev, [task.id]: 'toggle' }));
    // Optimistically update task completion and progress
    const prevTasks = [...savedTasks];
    const updatedTasks = savedTasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t);
    setSavedTasks(updatedTasks);
    // Optimistically update progress bar and x/x text
    const completedCount = updatedTasks.filter(t => t.completed).length;
    const totalCount = updatedTasks.length;
    setProgress({
      total: totalCount,
      completed: completedCount,
      progress: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
    });
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!res.ok) throw new Error(await res.text() || 'Failed to update');
      fetchTasksAndProgress();
    } catch (e: any) {
      // Failure: revert
      setSavedTasks(prevTasks);
      // Recalculate progress from prevTasks
      const completedCount = prevTasks.filter(t => t.completed).length;
      const totalCount = prevTasks.length;
      setProgress({
        total: totalCount,
        completed: completedCount,
        progress: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
      });
      setSnackbar({ message: e.message || 'Failed to update task', type: 'error' });
      setSnackbarVisible(true);
    } finally {
      setSavedTaskLoading(prev => ({ ...prev, [task.id]: null }));
    }
  };

  // Delete a task (optimistic UI)
  const handleDeleteTask = async (taskId: number) => {
    if (!token) return;
    // Optimistically remove from UI
    const prevTasks = savedTasks;
    setSavedTaskLoading(prev => ({ ...prev, [taskId]: 'delete' }));
    setSavedTasks(tasks => tasks.filter(t => t.id !== taskId));
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(await res.text() || 'Failed to delete');
      // Success: do nothing, already removed
      setSnackbar({ message: 'Task deleted!', type: 'success' });
      setSnackbarVisible(true);
      fetchTasksAndProgress();
    } catch (e: any) {
      // Failure: revert
      setSavedTasks(prevTasks);
      setSnackbar({ message: e.message || 'Failed to delete task', type: 'error' });
      setSnackbarVisible(true);
    } finally {
      setSavedTaskLoading(prev => ({ ...prev, [taskId]: null }));
    }
  };

  // Start editing a task
  const handleStartEditTask = (task: Task) => {
    setEditTaskId(task.id);
    setEditTaskContent(task.content);
    setEditTaskCategory(task.category || '');
    setEditTaskDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
  };

  // Save edited task
  const handleSaveEditTask = async (task: Task) => {
    if (!token) return;
    const result = updateTaskSchema.safeParse({ content: editTaskContent, category: editTaskCategory, dueDate: editTaskDueDate ? new Date(editTaskDueDate).toISOString() : undefined });
    if (!result.success) {
      setSnackbar({ message: result.error.errors[0].message, type: 'error' });
      setSnackbarVisible(true);
      return;
    }
    setSavedTaskLoading(prev => ({ ...prev, [task.id]: 'edit' }));
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editTaskContent, category: editTaskCategory, dueDate: editTaskDueDate ? new Date(editTaskDueDate).toISOString() : null }),
      });
      setEditTaskId(null);
      setEditTaskContent('');
      setEditTaskCategory('');
      setEditTaskDueDate('');
      fetchTasksAndProgress();
      fetchCategories();
    } catch (e: any) {
      setSnackbar({ message: e.message, type: 'error' });
      setSnackbarVisible(true);
    } finally {
      setSavedTaskLoading(prev => ({ ...prev, [task.id]: null }));
    }
  };

  // Cancel editing
  const handleCancelEditTask = () => {
    setEditTaskId(null);
    setEditTaskContent('');
    setEditTaskCategory('');
    setEditTaskDueDate('');
  };

  // Defensive flatten for savedTasks in case of nested arrays
  const flatSavedTasks = Array.isArray(savedTasks) && typeof savedTasks[0] === 'object' && !Array.isArray(savedTasks[0])
    ? savedTasks
    : savedTasks.flat ? savedTasks.flat() : savedTasks;

  const counts = useSubtaskCounts(flatSavedTasks, token ?? '');

  // Calculate usedCategories from allTasks, memoized so it only changes when allTasks changes
  useEffect(() => {
    // Only set once when allTasks is first loaded and not empty
    if (allTasks.length > 0 && usedCategories.length === 0) {
      setUsedCategories(Array.from(
        new Set(
          allTasks
            .map((t: Task) => t.category)
            .filter((cat): cat is string => typeof cat === 'string')
        )
      ));
    }
    // eslint-disable-next-line
  }, [allTasks]);

  // Inline handler for adding a subtask
  const handleAddSubtask = async (
    taskId: number,
    token: string,
    content: string,
    setNewSubtaskInputs: React.Dispatch<React.SetStateAction<{ [taskId: number]: string }>>
  ) => {
    if (!content.trim()) return;
    await fetch(`/api/tasks/${taskId}/subtasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
    setNewSubtaskInputs((prev) => ({ ...prev, [taskId]: '' }));
    fetchTasksAndProgress(); // Update tasks and subtasks count immediately
  };

  // Add discard handler
  const handleDiscardAll = () => {
    setGeneratedTasks([]);
    setGeneratedTaskCategories({});
    setGeneratedTaskDueDates({});
    setTopic(''); // Clear topic when all generated tasks are discarded
  };

  // Add new category handler
  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCreateCategoryLoading(true);
    try {
      // Persist the new category to the backend
      await fetch('/api/tasks/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      // Refetch categories from backend
      fetchCategories();
      setSnackbar({ message: 'Category created!', type: 'success' });
      setSnackbarVisible(true);
      setCreateCategoryOpen(false);
      setNewCategoryName('');
    } catch (err: any) {
      setSnackbar({ message: err.message || 'Failed to create category', type: 'error' });
      setSnackbarVisible(true);
    } finally {
      setCreateCategoryLoading(false);
    }
  };

  // Add this helper at the top of TaskDashboard
  function showNotification({ message, type }: { message: string, type: 'error' | 'success' }) {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      window.dispatchEvent(new CustomEvent('header-notification', { detail: { message, type } }));
    } else {
      setSnackbar({ message, type });
      setSnackbarVisible(true);
    }
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => setMobileMenuOpen(null);
    if (mobileMenuOpen !== null) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [mobileMenuOpen]);

  return (<>
    {showIntro ? (
      <div className="relative flex flex-col items-center sm:px-0 justify-center gap-8 overflow-hidden">
        {/* Content above canvas */}
        <div className="relative z-10 flex flex-col items-center w-full py-16 px-6 sm:px-0">

          <h2 className="text-2xl sm:text-3xl font-semibold mb-2 sm:mb-3 text-center tracking-tight">
            Ready to Achieve More?
          </h2>
          <p className="text-base sm:text-lg mb-4 text-gray-700 text-center max-w-xl font-normal">
            Kickstart your productivity journey! Describe your goal or project, and we'll instantly generate a set of actionable tasks for you.
          </p>
          <div className="w-full max-w-xl bg-white/80 rounded-2xl shadow-xl shadow-[20] p-4 sm:p-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center border border-blue-100">
            <Input
              className="flex-1 text-base sm:text-xl px-4 sm:px-4 py-[8px] sm:py-[18px] border-2 border-gray-400 focus:border-blue-500 rounded-lg shadow-sm bg-white w-full"
              placeholder="What do you want to achieve?"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              autoFocus
            />
            <div className="relative w-[180px] h-[38px]">
              <AnimatedLinesBackground loading={generateLoading} />
              <Button
                onClick={handleGenerate}
                disabled={!topic || generateLoading}
                className="w-full h-full text-sm sm:text-xl px-2 sm:px-4 py-3 sm:py-4 rounded-lg cursor-pointer bg-gradient-to-r opacity-70 from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 text-white font-bold shadow-lg transition-colors duration-400 scale-105 relative z-10"
              >
                {generateLoading ? 'Generating...' : 'Generate Tasks'}
              </Button>
            </div>
          </div>
          {/* Suggestion Chips */}
          <div className="flex flex-wrap gap-2 mt-6 w-full justify-center">
            {['Learn meditation', 'Start a Blog', 'Fitness Routine', 'Plan a Trip', 'Read More Books'].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setTopic(suggestion)}
                className="px-3 py-1 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium transition-colors border border-blue-200 shadow-sm cursor-pointer"
                style={{ outline: 'none' }}
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div></div>
        </div>
      </div>
    ) : <div className="w-full max-w-4xl mx-auto mt-2 sm:mt-8 space-y-8 bg-white rounded-xl sm:shadow-lg p-6 transition-all duration-300 text-gray-900 min-h-screen">
      {initialLoading ? (
        <div className="space-y-4">
          {/* Replace with your actual skeleton component or markup */}
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-12 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-12 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-12 bg-gray-200 rounded w-full animate-pulse" />
        </div>
      ) : (
        <>
          {/* Empty state: show only when no saved tasks and no generated tasks */}
          <>
            {/* Progress Bar */}
            {flatSavedTasks.length !== 0 &&
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">Progress</span>
                  <span className="text-sm text-gray-800">{progress.completed}/{progress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress.progress}%` }}
                  ></div>
                </div>
              </div>}



            {/* Topic and category input and generate button */}
            <div className="flex gap-2 flex-col sm:flex-row">
              <Input
                className="flex-1 p-4 py-2 sm:py-5"
                placeholder="Enter a goal"
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
              <Button //
                onClick={handleGenerate}
                disabled={!topic || generateLoading}
                className='cursor-pointer p-5'

              >
                {generateLoading ? 'Generating...' : 'Generate Tasks'}
              </Button>
            </div>
            {snackbarVisible && (
              <Snackbar
                message={snackbar?.message || ''}
                type={snackbar?.type}
                isVisible={snackbarVisible}
                onClose={() => setSnackbarVisible(false)}
                position="top"
                direction="down"
              />
            )}

            {/* Generated tasks */}
            {generatedTasks.length > 0 && (
              <div className="overflow-x-auto w-full">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-y-2 w-full min-w-[320px]">
                  <h3 className="font-semibold text-gray-900 mb-2 sm:mb-0 text-center w-full sm:w-auto">Generated Tasks</h3>
                  <div className="flex flex-col sm:flex-row gap-2 gap-y-2 items-center justify-center sm:justify-end w-[90%] sm:w-auto flex-wrap">
                    {flatSavedTasks.length == 0 && <Dialog open={createCategoryOpen} onOpenChange={setCreateCategoryOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="ml-1 cursor-pointer flex items-center gap-1 w-full sm:w-auto"
                          aria-label="Create Category"
                        >
                          Create Category
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                          <DialogTitle>Create New Category</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateCategory} className="flex flex-col gap-4 mt-2">
                          <Input
                            autoFocus
                            placeholder="Category name"
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            maxLength={50}
                            required
                          />
                          <DialogFooter className="flex gap-2 justify-end">
                            <DialogClose asChild>
                              <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={createCategoryLoading || !newCategoryName.trim()}>
                              {createCategoryLoading ? 'Saving...' : 'Save'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>}
                    <Button
                      variant="outline"
                      onClick={handleGenerate}
                      className="ml-1 cursor-pointer flex items-center gap-1 w-full sm:w-auto"
                      aria-label="Regenerate Tasks"
                    >
                      Regenerate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        (async () => {
                          setSaveAllLoading(true);
                          if (!token) return;
                          const savePromises = generatedTasks.map((task, i) => {
                            const taskCategory = generatedTaskCategories[i] || '';
                            const dueDate = generatedTaskDueDates[i] ? new Date(generatedTaskDueDates[i]).toISOString() : undefined;
                            const result = taskSchema.safeParse({ content: task, category: taskCategory });
                            if (!result.success) return Promise.resolve({ error: result.error.errors[0].message });
                            return fetch('/api/tasks', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({ content: task, category: taskCategory, dueDate }),
                            }).then(res => res.ok ? null : res.text().then(msg => ({ error: msg })));
                          });
                          const results = await Promise.all(savePromises);
                          const errors = results.filter(r => r && r.error);
                          setGeneratedTasks([]);
                          setGeneratedTaskCategories({});
                          setGeneratedTaskDueDates({});
                          setTopic(''); // Clear topic when all generated tasks are saved
                          await fetchTasksAndProgress();
                          await fetchCategories();
                          if (errors.length > 0) {
                            setSnackbar({ message: `Some tasks failed to save: ${errors.map(e => e && e.error).join('; ')}`, type: 'error' });
                          } else {
                            setSnackbar({ message: 'All tasks saved!', type: 'success' });
                          }
                          setSnackbarVisible(true);
                          setSaveAllLoading(false);
                        })();
                      }}
                      disabled={saveAllLoading || Object.values(generatedTaskLoading).some(Boolean) || generatedTasks.length === 0}
                      className="ml-1 cursor-pointer flex items-center gap-1 w-full sm:w-auto"
                      aria-label="Save All Generated Tasks"
                    >
                      {saveAllLoading ? 'Saving...' : 'Save All'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDiscardAll}
                      className="ml-1 cursor-pointer flex items-center gap-1 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 focus:ring-red-500 w-full sm:w-auto"
                      aria-label="Discard All Generated Tasks"
                    >
                      Discard All
                    </Button>
                  </div>
                </div>
                <ul className="space-y-2">
                  {generatedTasks.map((task: string, i: number) => (
                    <li
                      key={i}
                      className="
                        flex flex-col md:flex-row
                        items-stretch md:items-center
                        gap-y-2 md:gap-y-0 md:gap-x-2
                        bg-gray-50 rounded-lg p-2 md:px-4 shadow-sm
                        transition-all duration-200 hover:shadow-md
                      "
                    >
                      <span className="flex-1 text-gray-900 break-words md:truncate">{task}</span>
                      <Select
                        value={generatedTaskCategories[i] || ''}
                        onValueChange={(v: string) => setGeneratedTaskCategories(prev => ({ ...prev, [i]: v }))}
                      >
                        <SelectTrigger className="w-full md:w-32 md:mr-2">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat, idx) => (
                            <SelectItem key={idx} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="relative w-full md:w-36 md:mr-2">
                        <ThemedDatePicker
                          value={generatedTaskDueDates[i] || ''}
                          onChange={(date: string) => setGeneratedTaskDueDates(prev => ({ ...prev, [i]: date }))}
                          minDate={todayStr}
                        />
                      </div>
                      <Button
                        onClick={() => handleSaveTask(task, i)}
                        disabled={!!generatedTaskLoading[i]}
                        className="w-full md:w-auto bg-green-600 cursor-pointer hover:bg-green-700"
                      >
                        {generatedTaskLoading[i] ? 'Saving...' : 'Save'}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Category filter dropdown and create category button */}
            {flatSavedTasks.length !== 0 &&
              <div className="flex flex-row gap-2 gap-y-2 items-center w-full">
                <label htmlFor="category-filter" className="text-gray-800 text-sm w-full sm:w-auto text-center sm:text-left">Filter by Category:</label>
                <div className="flex flex-row gap-2">
                  <Select value={selectedCategory || 'all'} onValueChange={(v: string) => {setSelectedCategory(v === 'all' ? '' : v);console.log(usedCategories)}}>
                    <SelectTrigger className="w-1/3 sm:w-[130px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {usedCategories.map((cat, i) => (
                        <SelectItem key={i} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={createCategoryOpen} onOpenChange={setCreateCategoryOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-1 px-2 py-1 text-xs w-40 sm:w-auto"
                        aria-label="Create Category"
                      >
                        <PlusIcon className="w-4 h-4" /> Create Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px]">
                      <DialogHeader>
                        <DialogTitle>Create New Category</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateCategory} className="flex flex-col gap-4 mt-2">
                        <Input
                          autoFocus
                          placeholder="Category name"
                          value={newCategoryName}
                          onChange={e => setNewCategoryName(e.target.value)}
                          maxLength={50}
                          required
                        />
                        <DialogFooter className="flex gap-2 justify-end">
                          <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                          </DialogClose>
                          <Button type="submit" disabled={createCategoryLoading || !newCategoryName.trim()}>
                            {createCategoryLoading ? 'Saving...' : 'Save'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>}
            {flatSavedTasks.length !== 0 &&
              <div>
                <h3 className="font-semibold mb-4 text-gray-900">Your Tasks</h3>

                {/* Mobile: All tasks in accordion */}
                <div className="sm:hidden">
                  <ul className="space-y-2">
                    {flatSavedTasks.map((task: Task) => (
                      <Accordion type="single" collapsible key={task.id} className="space-y-2">
                        <AccordionItem value={String(task.id)} className="bg-gray-50 rounded-lg shadow-sm">
                          <AccordionTrigger className="w-full px-4 no-underline hover:no-underline cursor-pointer">
                            <div className="group flex items-center gap-2 w-full mb-1">
                              {editTaskId === task.id ? (
                                <div className="flex items-center pr-3 sm:pr-0 justify-center flex-col sm:flex-row gap-2 w-full">
                                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                                    <Input
                                      className="flex-1 w-full font-normal py-2"
                                      value={editTaskContent}
                                      onChange={e => setEditTaskContent(e.target.value)}
                                      key={`edit-input-${task.id}`}
                                    />
                                    <Select
                                      value={editTaskCategory || ''}
                                      onValueChange={(v: string) => setEditTaskCategory(v)}
                                    >
                                      <SelectTrigger className="w-full sm:w-32 font-normal">
                                        <SelectValue placeholder="Category" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {categories.map((cat, idx) => (
                                          <SelectItem key={idx} value={cat}>{cat}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <div className="relative w-full sm:w-36">
                                      <ThemedDatePicker
                                        value={editTaskDueDate}
                                        onChange={(date: string) => setEditTaskDueDate(date)}
                                        minDate={todayStr}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-center flex-row gap-2 ">
                                    <Button
                                      onClick={() => handleSaveEditTask(task)}
                                      className="w-full sm:w-auto p-2 cursor-pointer"
                                      disabled={savedTaskLoading[task.id] === 'edit' || !editTaskContent.trim()}
                                      variant="ghost"
                                      aria-label="Save Task"
                                    >
                                      {savedTaskLoading[task.id] === 'edit' ? (
                                        <span className="text-xs">...</span>
                                      ) : (
                                        <CheckIcon className="w-4 h-4 text-green-600 cursor-pointer" />
                                      )}
                                    </Button>
                                    <Button
                                      onClick={handleCancelEditTask}
                                      className="w-full sm:w-auto p-2 cursor-pointer"
                                      disabled={savedTaskLoading[task.id] === 'edit'}
                                      variant="ghost"
                                      aria-label="Cancel Edit"
                                    >
                                      <Cross2Icon className="w-4 h-4 text-gray-500 cursor-pointer mr-2" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className='flex flex-row w-full'>

                                  <div className='flex flex-1 gap-2 items-center'>
                                    <Checkbox
                                      checked={task.completed}
                                      onCheckedChange={() => handleToggleComplete(task)}
                                      disabled={savedTaskLoading[task.id] === 'toggle'}
                                      className="mr-2 cursor-pointer self-center"
                                      id="task-checkbox"
                                    />
                                    <div className='flex flex-col items-left'>
                                      <span className={task.completed ? 'text-left line-through text-gray-400 font-normal' : 'self-center text-left text-gray-900 font-normal'}>{task.content}</span>
                                      <div className='self-baseline mt-1'>
                                        {task.category && <span className={`px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs self-center ${task.dueDate ? "" : 'mr-2 self-center'}`}>{task.category}</span>}
                                        {task.dueDate && <span className="ml-2 mr-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs self-center">{task.dueDate.slice(0, 10)}</span>}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Three dot menu for mobile */}
                                  <div className="sm:hidden flex items-center ml-1 mr-1 relative">
                                    <button
                                      className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      onClick={() => setMobileMenuOpen(task.id)}
                                      aria-label="Open actions menu"
                                    >
                                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="4" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="16" r="1.5" /></svg>
                                    </button>
                                    {mobileMenuOpen === task.id && (
                                      <div className="absolute right-0 z-10 mt-2 w-28 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <button
                                          onClick={() => { handleStartEditTask(task); setMobileMenuOpen(null); }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => { handleDeleteTask(task.id); setMobileMenuOpen(null); }}
                                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  {/* Desktop edit/delete icons (unchanged) */}
                                  <div className="hidden sm:inline-flex">
                                    <Button
                                      onClick={() => handleStartEditTask(task)}
                                      className="p-2 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                      disabled={savedTaskLoading[task.id] === 'edit' || savedTaskLoading[task.id] === 'toggle'}
                                      variant="ghost"
                                      aria-label="Edit Task"
                                    >
                                      <Pencil1Icon className="w-4 h-4 cursor-pointer" />
                                    </Button>
                                    <Button
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="p-2 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                      disabled={savedTaskLoading[task.id] === 'delete'}
                                      variant="ghost"
                                      aria-label="Delete Task"
                                    >
                                      {savedTaskLoading[task.id] === 'delete' ? (
                                        <span className="text-xs">...</span>
                                      ) : (
                                        <TrashIcon className="w-4 h-4 text-red-500 cursor-pointer" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-2">
                            {task.id && token && (
                              <TaskSubtasks taskId={task.id} token={token} />
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ))}
                  </ul>
                </div>
                {/* Desktop: original logic */}
                <div className="hidden sm:block">
                  <ul className="space-y-2">
                    {flatSavedTasks.map((task: Task) => {
                      const hasSubtasks = counts[task.id] > 0;
                      if (hasSubtasks) {
                        return (
                          <Accordion type="multiple" key={task.id} className="space-y-2">
                            <AccordionItem value={String(task.id)} className="bg-gray-50 rounded-lg shadow-sm">
                              <AccordionTrigger className="w-full px-4 no-underline hover:no-underline cursor-pointer">
                                <div className="group flex items-center gap-2 w-full">
                                  {editTaskId === task.id ? (
                                    <div className="flex items-center pr-3 sm:pr-0 justify-center flex-col sm:flex-row gap-2 w-full">
                                      <div className="flex flex-col sm:flex-row gap-2 w-full">
                                        <Input
                                          className="flex-1 w-full font-normal"
                                          value={editTaskContent}
                                          onChange={e => setEditTaskContent(e.target.value)}
                                          key={`edit-input-${task.id}`}
                                        />
                                        <Select
                                          value={editTaskCategory || ''}
                                          onValueChange={(v: string) => setEditTaskCategory(v)}
                                        >
                                          <SelectTrigger className="w-full sm:w-32 font-normal">
                                            <SelectValue placeholder="Category" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {categories.map((cat, idx) => (
                                              <SelectItem key={idx} value={cat}>{cat}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <div className="relative w-full sm:w-36">
                                          <ThemedDatePicker

                                            value={editTaskDueDate}
                                            onChange={(date: string) => setEditTaskDueDate(date)}
                                            minDate={todayStr}
                                          />
                                        </div>
                                      </div>
                                      <div className="flex flex-col sm:flex-row gap-2 w-full">
                                        <Button
                                          onClick={() => handleSaveEditTask(task)}
                                          className="w-full sm:w-auto p-2 cursor-pointer"
                                          disabled={savedTaskLoading[task.id] === 'edit' || !editTaskContent.trim()}
                                          variant="ghost"
                                          aria-label="Save Task"
                                        >
                                          {savedTaskLoading[task.id] === 'edit' ? (
                                            <span className="text-xs">...</span>
                                          ) : (
                                            <CheckIcon className="w-4 h-4 text-green-600 cursor-pointer" />
                                          )}
                                        </Button>
                                        <Button
                                          onClick={handleCancelEditTask}
                                          className="w-full sm:w-auto p-2 cursor-pointer"
                                          disabled={savedTaskLoading[task.id] === 'edit'}
                                          variant="ghost"
                                          aria-label="Cancel Edit"
                                        >
                                          <Cross2Icon className="w-4 h-4 text-gray-500 cursor-pointer mr-2" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className='flex w-full'>
                                      <div className='flex flex-1 gap-2 items-center'>
                                        <Checkbox
                                          checked={task.completed}
                                          onCheckedChange={() => handleToggleComplete(task)}
                                          disabled={savedTaskLoading[task.id] === 'toggle'}
                                          className="mr-2 cursor-pointer self-center"
                                        />
                                        <span className={task.completed ? 'self-center line-through text-gray-400 font-normal' : 'self-center text-gray-900 font-normal'}>{task.content}</span>
                                        {/* Kebab menu for mobile */}
                                        <div className="sm:hidden flex items-center ml-2 relative">
                                          <button
                                            className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            onClick={() => setMobileMenuOpen(task.id)}
                                            aria-label="Open actions menu"
                                          >
                                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="4" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="16" r="1.5" /></svg>
                                          </button>
                                          {mobileMenuOpen === task.id && (
                                            <div className="absolute right-0 z-10 mt-2 w-28 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                              <button
                                                onClick={() => { handleStartEditTask(task); setMobileMenuOpen(null); }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                              >
                                                Edit
                                              </button>
                                              <button
                                                onClick={() => { handleDeleteTask(task.id); setMobileMenuOpen(null); }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                        {/* Desktop edit/delete icons (unchanged) */}
                                        <div className="hidden sm:inline-flex">
                                          <Button
                                            onClick={() => handleStartEditTask(task)}
                                            className="p-2 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                            disabled={savedTaskLoading[task.id] === 'edit' || savedTaskLoading[task.id] === 'toggle'}
                                            variant="ghost"
                                            aria-label="Edit Task"
                                          >
                                            <Pencil1Icon className="w-4 h-4 cursor-pointer" />
                                          </Button>
                                          <Button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="p-2 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                            disabled={savedTaskLoading[task.id] === 'delete'}
                                            variant="ghost"
                                            aria-label="Delete Task"
                                          >
                                            {savedTaskLoading[task.id] === 'delete' ? (
                                              <span className="text-xs">...</span>
                                            ) : (
                                              <TrashIcon className="w-4 h-4 text-red-500 cursor-pointer" />
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                      {task.category && <span className={`ml-2 px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs self-center ${task.dueDate ? "" : 'mr-2 self-center'}`}>{task.category}</span>}
                                      {task.dueDate && <span className="ml-2 mr-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs self-center">{task.dueDate.slice(0, 10)}</span>}
                                    </div>
                                  )}
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-2">
                                {task.id && token && (
                                  <TaskSubtasks taskId={task.id} token={token} />
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        );
                      } else {
                        // No subtasks: render as normal list item with inline add subtask field
                        return (
                          <li key={task.id} className="group bg-gray-50 rounded-lg p-2 px-4 shadow-sm transition-all duration-200 hover:shadow-md">
                            <div className="flex items-center w-full">
                              <div className='flex-1 gap-2 flex items-center'>
                                {editTaskId === task.id ? (
                                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                                    <div className="flex-1 flex flex-col sm:flex-row gap-2 w-full">
                                      <Input
                                        className="flex-1 w-auto font-normal"
                                        value={editTaskContent}
                                        onChange={e => setEditTaskContent(e.target.value)}
                                        key={`edit-input-${task.id}`}
                                      />
                                      <Select
                                        value={editTaskCategory || ''}
                                        onValueChange={(v: string) => setEditTaskCategory(v)}
                                      >
                                        <SelectTrigger className="w-full sm:w-32 font-normal">
                                          <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {categories.map((cat, idx) => (
                                            <SelectItem key={idx} value={cat}>{cat}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <div className="relative w-full sm:w-36">
                                        <ThemedDatePicker
                                          value={editTaskDueDate}
                                          onChange={(date: string) => setEditTaskDueDate(date)}
                                          minDate={todayStr}
                                          className="bg-red-500"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                                      <Button
                                        onClick={() => handleSaveEditTask(task)}
                                        className="w-full sm:w-auto p-2 cursor-pointer"
                                        disabled={savedTaskLoading[task.id] === 'edit' || !editTaskContent.trim()}
                                        variant="ghost"
                                        aria-label="Save Task"
                                      >
                                        {savedTaskLoading[task.id] === 'edit' ? (
                                          <span className="text-xs">...</span>
                                        ) : (
                                          <CheckIcon className="w-4 h-4 text-green-600 cursor-pointer" />
                                        )}
                                      </Button>
                                      <Button
                                        onClick={handleCancelEditTask}
                                        className="w-full sm:w-auto p-2 cursor-pointer"
                                        disabled={savedTaskLoading[task.id] === 'edit'}
                                        variant="ghost"
                                        aria-label="Cancel Edit"
                                      >
                                        <Cross2Icon className="w-4 h-4 text-gray-500 cursor-pointer mr-2" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <Checkbox
                                      checked={task.completed}
                                      onCheckedChange={() => handleToggleComplete(task)}
                                      disabled={savedTaskLoading[task.id] === 'toggle'}
                                      className="mr-2 cursor-pointer self-center"
                                    />
                                    <span className={task.completed ? 'line-through self-center text-gray-400 font-normal' : 'self-center text-gray-900 font-normal'}>{task.content}</span>
                                    {/* Kebab menu for mobile */}
                                    <div className="sm:hidden flex items-center ml-2 relative">
                                      <button
                                        className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onClick={() => setMobileMenuOpen(task.id)}
                                        aria-label="Open actions menu"
                                      >
                                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="4" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="16" r="1.5" /></svg>
                                      </button>
                                      {mobileMenuOpen === task.id && (
                                        <div className="absolute right-0 z-10 mt-2 w-28 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                          <button
                                            onClick={() => { handleStartEditTask(task); setMobileMenuOpen(null); }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => { handleDeleteTask(task.id); setMobileMenuOpen(null); }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    {/* Desktop edit/delete icons (unchanged) */}
                                    <div className="hidden sm:inline-flex">
                                      <Button
                                        onClick={() => handleStartEditTask(task)}
                                        className="p-2 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                        disabled={savedTaskLoading[task.id] === 'edit' || savedTaskLoading[task.id] === 'toggle'}
                                        variant="ghost"
                                        aria-label="Edit Task"
                                      >
                                        <Pencil1Icon className="w-4 h-4 cursor-pointer" />
                                      </Button>
                                      <Button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="p-2 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                        disabled={savedTaskLoading[task.id] === 'delete'}
                                        variant="ghost"
                                        aria-label="Delete Task"
                                      >
                                        {savedTaskLoading[task.id] === 'delete' ? (
                                          <span className="text-xs">...</span>
                                        ) : (
                                          <TrashIcon className="w-4 h-4 text-red-500 cursor-pointer" />
                                        )}
                                      </Button>
                                    </div>

                                  </>
                                )}
                              </div>
                              {task.category && <span className={`ml-2 px-2 py-1 rounded bg-green-100 text-green-800 text-xs self-center ${task.dueDate ? "" : 'mr-2 self-center'}`}>{task.category}</span>}
                              {task.dueDate && <span className="ml-2 mr-2 px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs self-center">{task.dueDate.slice(0, 10)}</span>}
                              {editTaskId !== task.id && <div className="flex items-center gap-1 ml-2">
                                <Input
                                  value={newSubtaskInputs[task.id] || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setNewSubtaskInputs(prev => ({ ...prev, [task.id]: val }));
                                  }}
                                  placeholder="Add subtask"
                                  className="w-32"
                                />
                                <Button
                                  onClick={() => task.id && token && handleAddSubtask(task.id, token, newSubtaskInputs[task.id], setNewSubtaskInputs)}
                                  disabled={!newSubtaskInputs[task.id] || !newSubtaskInputs[task.id].trim()}
                                  className="p-2 cursor-pointer"
                                  variant="ghost"
                                  aria-label="Add Subtask"
                                >
                                  <PlusIcon className="w-4 h-4" />
                                </Button>
                              </div>}
                            </div>
                          </li>
                        );
                      }
                    })}
                  </ul>
                </div>
              </div>}
          </>
        </>
      )}
    </div>}
    <Snackbar
      message={snackbar?.message || ''}
      type={snackbar?.type}
      isVisible={snackbarVisible}
      onClose={() => setSnackbarVisible(false)}
      position="top"
      direction="down"
    />
  </>
  );
}

function TaskDashboardWithBoundary() {
  return (
    <ErrorBoundary>
      <TaskDashboard />
    </ErrorBoundary>
  );
}

export default TaskDashboardWithBoundary;

type Line = {
  x: number;
  y: number;
  angle: number;
  speed: number;
  length: number;
  opacity: number;
  width: number;
};

function AnimatedLinesBackground({ loading }: { loading?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const linesRef = useRef<Line[]>([]);

  // Helper to resize canvas to parent size
  const resizeCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas || !canvas.parentElement) return;
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    canvas.width = parent.offsetWidth * dpr;
    canvas.height = parent.offsetHeight * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    resizeCanvas(canvas);
    const handleResize = () => {
      if (canvasRef.current) resizeCanvas(canvasRef.current);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [loading]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    let ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width = canvas.parentElement.offsetWidth;
    let height = canvas.parentElement.offsetHeight;
    let numLines = Math.floor((width * height) / 8000);
    if (numLines < 8) numLines = 8;
    if (numLines > 20) numLines = 20;

    function randomLine(): Line {
      const edge = Math.random() < 0.5 ? 'left' : 'bottom';
      let startX: number, startY: number;
      if (edge === 'left') {
        startX = -20;
        startY = Math.random() * height;
      } else {
        startX = Math.random() * width;
        startY = height + 20;
      }
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.08;
      const speed = 2.5 + Math.random() * 2.5;
      const length = 200 + Math.random() * 200;
      return { x: startX, y: startY, angle, speed, length, opacity: 0.3, width: 1 };
    }
    linesRef.current = Array.from({ length: numLines }, randomLine);

    function animate() {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      ctx = canvas.getContext('2d');
      if (!ctx) return;
      width = canvas.parentElement.offsetWidth;
      height = canvas.parentElement.offsetHeight;
      ctx.clearRect(0, 0, width, height);
      for (let line of linesRef.current) {
        ctx.save();
        ctx.globalAlpha = line.opacity;
        ctx.strokeStyle = '#6cf';
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#6cf';
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(
          line.x + Math.cos(line.angle) * line.length,
          line.y - Math.sin(line.angle) * line.length
        );
        ctx.stroke();
        ctx.restore();
        line.x += Math.cos(line.angle) * line.speed;
        line.y -= Math.sin(line.angle) * line.speed;
        if (line.x > width + 40 || line.y < -40) {
          Object.assign(line, randomLine());
        }
      }
      animationRef.current = window.requestAnimationFrame(animate);
    }
    animationRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
    };
  }, [loading]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-0 pointer-events-none"
      style={{ display: 'block', borderRadius: '0.75rem' }}
      aria-hidden="true"
    />
  );
} 