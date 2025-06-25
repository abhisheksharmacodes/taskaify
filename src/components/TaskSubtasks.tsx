import React, { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Pencil1Icon, TrashIcon, CheckIcon, Cross2Icon, PlusIcon } from '@radix-ui/react-icons';

interface Subtask {
  id: number;
  content: string;
  completed: boolean;
}

interface TaskSubtasksProps {
  taskId: number;
  token: string;
}

export default function TaskSubtasks({ taskId, token }: TaskSubtasksProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editLoading, setEditLoading] = useState<{ [id: number]: boolean }>({});
  const [addLoading, setAddLoading] = useState(false);

  const fetchSubtasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSubtasks(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId && token) fetchSubtasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, token]);

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    setAddLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newContent }),
      });
      if (res.ok) {
        setNewContent('');
        fetchSubtasks();
      }
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggle = async (subtask: Subtask) => {
    setEditLoading(l => ({ ...l, [subtask.id]: true }));
    try {
      await fetch(`/api/tasks/${taskId}/subtasks/${subtask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !subtask.completed }),
      });
      fetchSubtasks();
    } finally {
      setEditLoading(l => ({ ...l, [subtask.id]: false }));
    }
  };

  const handleEdit = (subtask: Subtask) => {
    setEditId(subtask.id);
    setEditContent(subtask.content);
  };

  const handleSave = async (subtask: Subtask) => {
    setEditLoading(l => ({ ...l, [subtask.id]: true }));
    try {
      await fetch(`/api/tasks/${taskId}/subtasks/${subtask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editContent }),
      });
      setEditId(null);
      setEditContent('');
      fetchSubtasks();
    } finally {
      setEditLoading(l => ({ ...l, [subtask.id]: false }));
    }
  };

  const handleCancel = () => {
    setEditId(null);
    setEditContent('');
  };

  const handleDelete = async (subtask: Subtask) => {
    setEditLoading(l => ({ ...l, [subtask.id]: true }));
    try {
      await fetch(`/api/tasks/${taskId}/subtasks/${subtask.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSubtasks();
    } finally {
      setEditLoading(l => ({ ...l, [subtask.id]: false }));
    }
  };

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-2">
        <Input
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          placeholder="Add subtask"
          className="flex-1"
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
        />
        <Button onClick={handleAdd} disabled={addLoading || !newContent.trim()} className="p-2 cursor-pointer" variant="ghost" aria-label="Add Subtask">
          <PlusIcon className="w-4 h-4" />
        </Button>
      </div>
      <ul className="space-y-1">
        {subtasks.map(subtask => (
          <li key={subtask.id} className="flex items-center gap-2 bg-gray-50 rounded p-2">
            <Checkbox
              checked={subtask.completed}
              onCheckedChange={() => handleToggle(subtask)}
              disabled={editLoading[subtask.id]}
              className="cursor-pointer"
            />
            {editId === subtask.id ? (
              <>
                <Input
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="flex-1"
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(subtask); }}
                />
                <Button onClick={() => handleSave(subtask)} disabled={editLoading[subtask.id] || !editContent.trim()} className="p-2 cursor-pointer" variant="ghost" aria-label="Save Subtask">
                  <CheckIcon className="w-4 h-4 text-green-600" />
                </Button>
                <Button onClick={handleCancel} disabled={editLoading[subtask.id]} className="p-2 cursor-pointer" variant="ghost" aria-label="Cancel Edit">
                  <Cross2Icon className="w-4 h-4 text-gray-500" />
                </Button>
              </>
            ) : (
              <>
                <span className={subtask.completed ? 'line-through text-gray-400 flex-1' : 'flex-1 text-gray-900'}>{subtask.content}</span>
                <Button onClick={() => handleEdit(subtask)} disabled={editLoading[subtask.id]} className="p-2 cursor-pointer" variant="ghost" aria-label="Edit Subtask">
                  <Pencil1Icon className="w-4 h-4" />
                </Button>
                <Button onClick={() => handleDelete(subtask)} disabled={editLoading[subtask.id]} className="p-2 cursor-pointer" variant="ghost" aria-label="Delete Subtask">
                  <TrashIcon className="w-4 h-4 text-red-500" />
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
} 