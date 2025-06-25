"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import Snackbar, { SnackbarType } from './Snackbar';

export default function TaskDashboard() {
  const { token } = useAuth();
  const [topic, setTopic] = useState('learn js');
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
  const [snackbar, setSnackbar] = useState<{ message: string; type: SnackbarType } | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  // Edit state
  const [editTaskId, setEditTaskId] = useState<number | null>(null);
  const [editTaskContent, setEditTaskContent] = useState('');
  const [editTaskCategory, setEditTaskCategory] = useState('');
  // State for per-generated-task category
  const [generatedTaskCategories, setGeneratedTaskCategories] = useState<{ [key: number]: string }>({});

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
    setGeneratedTaskLoading(prev => ({ ...prev, [index]: true }));
    const taskCategory = generatedTaskCategories[index] || '';
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, category: taskCategory }),
      });
      setGeneratedTasks(prevTasks => {
        const newTasks = prevTasks.filter((_, i) => i !== index);
        // Rebuild categories to match new indices
        const newCategories: { [key: number]: string } = {};
        newTasks.forEach((_, newIdx) => {
          const oldIdx = newIdx < index ? newIdx : newIdx + 1;
          newCategories[newIdx] = generatedTaskCategories[oldIdx] || 'general';
        });
        setGeneratedTaskCategories(newCategories);
        return newTasks;
      });
      fetchTasksAndProgress();
      fetchCategories();
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
      setSnackbar({ message: task.completed ? 'Marked as incomplete!' : 'Marked as complete!', type: 'success' });
      setSnackbarVisible(true);
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
    setEditTaskId(task.id);
    setEditTaskContent(task.content);
    setEditTaskCategory(task.category || '');
  };

  // Save edited task
  const handleSaveEditTask = async (task: any) => {
    if (!token) return;
    setSavedTaskLoading(prev => ({ ...prev, [task.id]: 'edit' }));
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editTaskContent, category: editTaskCategory }),
      });
      setEditTaskId(null);
      setEditTaskContent('');
      setEditTaskCategory('');
      fetchTasksAndProgress();
      fetchCategories();
      setSnackbar({ message: 'Task updated!', type: 'success' });
      setSnackbarVisible(true);
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
  };

  // Defensive flatten for savedTasks in case of nested arrays
  const flatSavedTasks = Array.isArray(savedTasks) && typeof savedTasks[0] === 'object' && !Array.isArray(savedTasks[0])
    ? savedTasks
    : savedTasks.flat ? savedTasks.flat() : savedTasks;

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 space-y-8 bg-white rounded-xl shadow-lg p-6 transition-all duration-300 text-gray-900">
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

      {/* Category filter dropdown */}
      <div className="flex gap-2 items-center">
        <label htmlFor="category-filter" className="text-gray-800 text-sm">Filter by Category:</label>
        <select
          id="category-filter"
          className="border rounded px-2 py-1 bg-gray-50 text-gray-900"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="">All</option>
          {categories.map((cat, i) => (
            <option key={i} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Topic and category input and generate button */}
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 bg-gray-50 text-gray-900"
          placeholder="Enter a topic (e.g. Learn Python)"
          value={topic}
          onChange={e => setTopic(e.target.value)}
        />
        <button
          onClick={handleGenerate}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow-md hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
          disabled={!topic || generateLoading}
        >
          {generateLoading ? 'Generating...' : 'Generate Tasks'}
        </button>
      </div>
      <Snackbar
        message={snackbar?.message || ''}
        type={snackbar?.type || 'success'}
        isVisible={snackbarVisible}
        onClose={() => setSnackbarVisible(false)}
      />

      {/* Generated tasks */}
      {generatedTasks.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-900">Generated Tasks</h3>
            <button
              onClick={() => {
                setGeneratedTasks([]);
                setGeneratedTaskCategories({});
              }}
              className="bg-red-500 text-white px-2 py-1 rounded shadow hover:bg-red-600 transition-all duration-200 ml-1 disabled:opacity-50"
            >
              Discard All
            </button>
          </div>
          <ul className="space-y-2">
            {generatedTasks.map((task: string, i: number) => (
              <li key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 shadow-sm transition-all duration-200 hover:shadow-md">
                <span className="flex-1 text-gray-900">{task}</span>
                <input
                  type="text"
                  className="w-32 border rounded px-2 py-1 mr-2"
                  value={generatedTaskCategories[i] || ''}
                  onChange={e => setGeneratedTaskCategories(prev => ({ ...prev, [i]: e.target.value }))}
                  list={`generated-category-list-${i}`}
                  placeholder="Category"
                />
                <datalist id={`generated-category-list-${i}`}>
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat} />
                  ))}
                </datalist>
                <button
                  onClick={() => handleSaveTask(task, i)}
                  className="bg-green-600 text-white px-2 py-1 rounded shadow hover:bg-green-700 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
                  disabled={!!generatedTaskLoading[i]}
                >
                  {generatedTaskLoading[i] ? 'Saving...' : 'Save'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Saved tasks */}
      <div>
        <h3 className="font-semibold mb-2 text-gray-900">Your Tasks</h3>
        <ul className="space-y-2">
          {flatSavedTasks.map((task: any) => (
            <li key={task.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 shadow-sm transition-all duration-200 hover:shadow-md">
              {editTaskId === task.id ? (
                <>
                  <input
                    type="text"
                    className="flex-1 border rounded px-2 py-1 mr-2"
                    value={editTaskContent}
                    onChange={e => setEditTaskContent(e.target.value)}
                  />
                  <input
                    type="text"
                    className="w-32 border rounded px-2 py-1 mr-2"
                    value={editTaskCategory}
                    onChange={e => setEditTaskCategory(e.target.value)}
                    list="category-list"
                    placeholder="Category"
                  />
                  <button
                    onClick={() => handleSaveEditTask(task)}
                    className="bg-blue-600 text-white px-2 py-1 rounded shadow hover:bg-blue-700 transition-all duration-200 mr-1 disabled:opacity-50"
                    disabled={savedTaskLoading[task.id] === 'edit' || !editTaskContent.trim()}
                  >
                    {savedTaskLoading[task.id] === 'edit' ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEditTask}
                    className="bg-gray-300 text-gray-800 px-2 py-1 rounded shadow hover:bg-gray-400 transition-all duration-200"
                    disabled={savedTaskLoading[task.id] === 'edit'}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className={task.completed ? 'line-through text-gray-400 flex-1' : 'flex-1 text-gray-900'}>{task.content}</span>
                  {task.category && <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs">{task.category}</span>}
                  {task.completed && <span className="text-xs text-green-600 ml-2">Done</span>}
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className={
                      (task.completed
                        ? 'bg-yellow-500 text-white px-2 py-1 rounded shadow hover:bg-yellow-600 hover:scale-105 active:scale-95 transition-all duration-200'
                        : 'bg-green-600 text-white px-2 py-1 rounded shadow hover:bg-green-700 hover:scale-105 active:scale-95 transition-all duration-200') +
                      ' disabled:opacity-50'
                    }
                    disabled={savedTaskLoading[task.id] === 'toggle'}
                  >
                    {savedTaskLoading[task.id] === 'toggle'
                      ? (task.completed ? 'Marking...' : 'Marking...')
                      : (task.completed ? 'Mark Incomplete' : 'Mark Complete')}
                  </button>
                  <button
                    onClick={() => handleStartEditTask(task)}
                    className="bg-blue-500 text-white px-2 py-1 rounded shadow hover:bg-blue-600 transition-all duration-200 ml-1 disabled:opacity-50"
                    disabled={savedTaskLoading[task.id] === 'edit' || savedTaskLoading[task.id] === 'toggle'}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded shadow hover:bg-red-600 transition-all duration-200 ml-1 disabled:opacity-50"
                    disabled={savedTaskLoading[task.id] === 'delete'}
                  >
                    {savedTaskLoading[task.id] === 'delete' ? 'Deleting...' : 'Delete'}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 