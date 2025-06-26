"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { Pencil1Icon, TrashIcon, CheckIcon, Cross2Icon, ReloadIcon, PlusIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { z } from 'zod';
import TaskSubtasks from './TaskSubtasks';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';

const taskSchema = z.object({
  content: z.string().min(1, 'Task cannot be empty').max(255, 'Task too long'),
  category: z.string().max(50, 'Category too long').optional(),
});
const updateTaskSchema = z.object({
  content: z.string().min(1, 'Task cannot be empty').max(255, 'Task too long').optional(),
  category: z.string().max(50, 'Category too long').optional(),
  completed: z.boolean().optional(),
});

export default function TaskDashboard() {
  const { token } = useAuth();
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState<string[]>([]);
  const [savedTasks, setSavedTasks] = useState<any[]>([]);
  const [progress, setProgress] = useState({ total: 0, completed: 0, progress: 0 });
  const [loading, setLoading] = useState(false);
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

  // Helper to get today's date in yyyy-mm-dd format
  const todayStr = new Date().toISOString().slice(0, 10);

  // Fetch categories
  const fetchCategories = () => {
    if (!token) return;
    fetch('/api/tasks/categories', { headers: { Authorization: `Bearer ${token}` } })
      .then(async res => {
        if (!res.ok) return [];
        const text = await res.text();
        if (!text) return [];
        return JSON.parse(text);
      })
      .then(cats => setCategories(cats.length > 0 ? cats : ['general']))
      .catch(() => setCategories(['general']));
  };

  // Fetch saved tasks and progress (with category filter)
  const fetchTasksAndProgress = () => {
    if (!token) return;
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
      .then(setSavedTasks)
      .catch(err => {
        setSnackbar({ message: 'Failed to fetch tasks: ' + (err.message || err), type: 'error' });
        setSnackbarVisible(true);
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
        setSnackbar({ message: 'Failed to fetch progress: ' + (err.message || err), type: 'error' });
        setSnackbarVisible(true);
      });
  };

  useEffect(() => {
    fetchCategories();
  }, [token, savedTasks]);

  useEffect(() => {
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
        body: JSON.stringify({ topic, category }),
      });
      if (!res.ok) {
        throw new Error('API error');
      }
      const text = await res.text();
      if (!text) {
        throw new Error('Empty response from API');
      }
      const data = JSON.parse(text);
      if (data.tasks) {
        setGeneratedTasks(data.tasks);
        // Set default category to 'general' for each generated task
        const defaultCategories: { [key: number]: string } = {};
        data.tasks.forEach((_: any, i: number) => {
          defaultCategories[i] = 'general';
        });
        setGeneratedTaskCategories(defaultCategories);
        setSnackbar({ message: 'Tasks generated!', type: 'success' });
        setSnackbarVisible(true);
        fetchTasksAndProgress();
        fetchCategories();
      }
      else {
        setSnackbar({ message: data.error || 'Failed to generate tasks', type: 'error' });
        setSnackbarVisible(true);
      }
    } catch (e: any) {
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

  // Toggle complete/incomplete
  const handleToggleComplete = async (task: any) => {
    if (!token) return;
    setSavedTaskLoading(prev => ({ ...prev, [task.id]: 'toggle' }));
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !task.completed }),
      });
      fetchTasksAndProgress();
    } catch (e: any) {
      setSnackbar({ message: e.message, type: 'error' });
      setSnackbarVisible(true);
    } finally {
      setSavedTaskLoading(prev => ({ ...prev, [task.id]: null }));
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId: number) => {
    if (!token) return;
    setSavedTaskLoading(prev => ({ ...prev, [taskId]: 'delete' }));
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchTasksAndProgress();
      setSnackbar({ message: 'Task deleted!', type: 'success' });
      setSnackbarVisible(true);
    } catch (e: any) {
      setSnackbar({ message: e.message, type: 'error' });
      setSnackbarVisible(true);
    } finally {
      setSavedTaskLoading(prev => ({ ...prev, [taskId]: null }));
    }
  };

  // Start editing a task
  const handleStartEditTask = (task: any) => {
    console.log('Editing task:', task);
    setEditTaskId(task.id);
    setEditTaskContent(task.content);
    setEditTaskCategory(task.category || '');
    setEditTaskDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
  };

  // Save edited task
  const handleSaveEditTask = async (task: any) => {
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

  // Helper to fetch subtask counts for all tasks
  const useSubtaskCounts = (tasks: any[], token: string): { [key: number]: number } => {
    const [counts, setCounts] = useState<{ [key: number]: number }>({});
    useEffect(() => {
      if (!token || !tasks.length) return;
      (async () => {
        const newCounts: { [key: number]: number } = {};
        await Promise.all(tasks.map(async (task: any) => {
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
  };

  // Add discard handler
  const handleDiscardAll = () => setGeneratedTasks([]);

  // Add new category handler
  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCreateCategoryLoading(true);
    try {
      // Optionally, call an API to persist the category
      // For now, just add to local state
      setCategories(prev => Array.from(new Set([...prev, newCategoryName.trim()])));
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

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 space-y-8 bg-white rounded-xl shadow-lg p-6 transition-all duration-300 text-gray-900">
      {/* Progress Bar */}
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
      </div>

      {/* Category filter dropdown and create category button */}
      <div className="flex gap-2 items-center">
        <label htmlFor="category-filter" className="text-gray-800 text-sm">Filter by Category:</label>
        <Select value={selectedCategory || 'all'} onValueChange={v => setSelectedCategory(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {categories.map((cat, i) => (
              <SelectItem key={i} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={createCategoryOpen} onOpenChange={setCreateCategoryOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-1 px-2 py-1 text-xs"
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

      {/* Topic and category input and generate button */}
      <div className="flex gap-2">
        <Input
          className="flex-1"
          placeholder="Enter a topic (e.g. Learn Python)"
          value={topic}
          onChange={e => setTopic(e.target.value)}
        />
        <Button
          onClick={handleGenerate}
          disabled={!topic || generateLoading}
          className='cursor-pointer'
        >
          {generateLoading ? 'Generating...' : 'Generate Tasks'}
        </Button>
      </div>
      {snackbarVisible && (
        <Alert
          variant={snackbar?.type === 'error' ? 'destructive' : 'default'}
          className="fixed bottom-4 left-4 z-[9999] max-w-sm w-full px-4"
        >
          <AlertDescription>{snackbar?.message || ''}</AlertDescription>
        </Alert>
      )}

      {/* Generated tasks */}
      {generatedTasks.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-900">Generated Tasks</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGenerate}
                className="ml-1 cursor-pointer flex items-center gap-1"
                aria-label="Regenerate Tasks"
              >
                Regenerate
              </Button>
              <Button
                variant="outline"
                onClick={handleDiscardAll}
                className="ml-1 cursor-pointer flex items-center gap-1 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 focus:ring-red-500"
                aria-label="Discard All Generated Tasks"
              >
                Discard All
              </Button>
            </div>
          </div>
          <ul className="space-y-2">
            {generatedTasks.map((task: string, i: number) => (
              <li key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 shadow-sm transition-all duration-200 hover:shadow-md">
                <span className="flex-1 text-gray-900">{task}</span>
                <Select
                  value={generatedTaskCategories[i] || ''}
                  onValueChange={v => setGeneratedTaskCategories(prev => ({ ...prev, [i]: v }))}
                >
                  <SelectTrigger className="w-32 mr-2">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat, idx) => (
                      <SelectItem key={idx} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="date"
                  className="w-36 mr-2 px-2 py-1 border rounded cursor-pointer"
                  value={generatedTaskDueDates[i] || ''}
                  onChange={e => setGeneratedTaskDueDates(prev => ({ ...prev, [i]: e.target.value }))}
                  placeholder="Due date"
                  min={todayStr}
                />
                <Button
                  onClick={() => handleSaveTask(task, i)}
                  disabled={!!generatedTaskLoading[i]}
                  className="bg-green-600 cursor-pointer hover:bg-green-700"
                >
                  {generatedTaskLoading[i] ? 'Saving...' : 'Save'}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Saved tasks */}
      <div>
        <h3 className="font-semibold mb-2 text-gray-900">Your Tasks</h3>
        {(() => {
          const counts = useSubtaskCounts(flatSavedTasks, token ?? '');
          return (
            <ul className="space-y-2">
              {flatSavedTasks.map((task: any) => {
                const hasSubtasks = counts[task.id] > 0;
                if (hasSubtasks) {
                  return (
                    <Accordion type="multiple" key={task.id} className="space-y-2">
                      <AccordionItem value={String(task.id)} className="bg-gray-50 rounded-lg shadow-sm">
                        <AccordionTrigger className="w-full px-4 no-underline hover:no-underline cursor-pointer">
                          <div className="group flex items-center gap-2 w-full">
                            {editTaskId === task.id ? (
                              <>
                                <Input
                                  className="flex-1 mr-2 font-normal"
                                  value={editTaskContent}
                                  onChange={e => setEditTaskContent(e.target.value)}
                                  key={`edit-input-${task.id}`}
                                />
                                <Select
                                  value={editTaskCategory || ''}
                                  onValueChange={v => setEditTaskCategory(v)}
                                >
                                  <SelectTrigger className="w-32 mr-2 font-normal">
                                    <SelectValue placeholder="Category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map((cat, idx) => (
                                      <SelectItem key={idx} value={cat}>{cat}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <input
                                  type="date"
                                  className="w-36 mr-2 px-2 py-1 border rounded cursor-pointer font-normal"
                                  value={editTaskDueDate}
                                  onChange={e => setEditTaskDueDate(e.target.value)}
                                  placeholder="Due date"
                                  min={todayStr}
                                />
                                <Button
                                  onClick={() => handleSaveEditTask(task)}
                                  className="mr-1 p-2 cursor-pointer"
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
                                  className="p-2 cursor-pointer"
                                  disabled={savedTaskLoading[task.id] === 'edit'}
                                  variant="ghost"
                                  aria-label="Cancel Edit"
                                >
                                  <Cross2Icon className="w-4 h-4 text-gray-500 cursor-pointer mr-2" />
                                </Button>
                              </>
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
                            <>
                              <Input
                                className="flex-1 mr-2 font-normal"
                                value={editTaskContent}
                                onChange={e => setEditTaskContent(e.target.value)}
                                key={`edit-input-${task.id}`}
                              />
                              <Select
                                value={editTaskCategory || ''}
                                onValueChange={v => setEditTaskCategory(v)}
                              >
                                <SelectTrigger className="w-32 mr-2 font-normal">
                                  <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat, idx) => (
                                    <SelectItem key={idx} value={cat}>{cat}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <input
                                type="date"
                                className="w-36 mr-2 px-2 py-1 border rounded cursor-pointer font-normal"
                                value={editTaskDueDate}
                                onChange={e => setEditTaskDueDate(e.target.value)}
                                placeholder="Due date"
                                min={todayStr}
                              />
                              <Button
                                onClick={() => handleSaveEditTask(task)}
                                className="mr-1 p-2 cursor-pointer"
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
                                className="p-2 cursor-pointer"
                                disabled={savedTaskLoading[task.id] === 'edit'}
                                variant="ghost"
                                aria-label="Cancel Edit"
                              >
                                <Cross2Icon className="w-4 h-4 text-gray-500 cursor-pointer" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={() => handleToggleComplete(task)}
                                disabled={savedTaskLoading[task.id] === 'toggle'}
                                className="mr-2 cursor-pointer self-center"
                              />
                              <span className={task.completed ? 'line-through self-center text-gray-400 font-normal' : 'self-center text-gray-900 font-normal'}>{task.content}</span>
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
                            </>
                          )}
                        </div>
                        {editTaskId !== task.id && (
                          <>
                            {task.category && <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs self-center">{task.category}</span>}
                            {task.dueDate && <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs self-center">{task.dueDate.slice(0, 10)}</span>}
                            <div className="flex items-center gap-1 ml-2">
                              <Input
                                value={newSubtaskInputs[task.id] || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setNewSubtaskInputs(prev => ({ ...prev, [task.id]: val }));
                                }}
                                placeholder="Add subtask"
                                className="w-32"
                                onKeyDown={e => { if (e.key === 'Enter') task.id && token && handleAddSubtask(task.id, token, newSubtaskInputs[task.id], setNewSubtaskInputs); }}
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
                            </div>
                          </>
                        )}
                      </div>
                    </li>
                  );
                }
              })}
            </ul>
          );
        })()}
      </div>
    </div>
  );
} 