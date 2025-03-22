'use client';

import { useEffect, useState } from 'react';
import ThemeToggle from './ui/ThemeToggle';

// TODO型の定義
interface Todo {
  id: number;
  text: string;
  completed: boolean;
  dueDate: string | null; // 期限
  priority: 'low' | 'medium' | 'high' | null; // 優先度を追加
}

// フィルタの種類を定義
type FilterType = 'all' | 'active' | 'completed';

export default function TodoApp() {
  // TODOリストの状態
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  
  // ローカルストレージからTODOデータを読み込む
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  // TODOデータが変更されたらローカルストレージに保存する
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // 新しいTODOを追加
  const addTodo = () => {
    if (inputText.trim()) {
      const newTodo: Todo = {
        id: Date.now(),
        text: inputText.trim(),
        completed: false,
        dueDate: dueDate || null,
        priority: priority
      };
      setTodos([...todos, newTodo]);
      setInputText('');
      setDueDate('');
      setPriority(null);
    }
  };

  // Enterキーでも追加できるようにする
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  // TODOの完了状態を切り替え
  const toggleTodoStatus = (id: number) => {
    setTodos(
      todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // TODOを削除
  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // 完了したTODOをすべて削除
  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
  };

  // 現在のフィルターに基づいてTODOをフィルタリング
  const filteredTodos = todos.filter(todo => {
    if (currentFilter === 'active') {
      return !todo.completed;
    } else if (currentFilter === 'completed') {
      return todo.completed;
    }
    return true; // 'all'の場合
  });

  // 残りのTODO数を計算
  const activeTodosCount = todos.filter(todo => !todo.completed).length;

  // 日付をフォーマットする関数
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // 期限が過ぎているかチェックする関数
  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 時間部分をリセット
    const due = new Date(dueDate);
    return due < today;
  };

  // 優先度に応じたスタイルを返す関数
  const getPriorityStyle = (priority: 'low' | 'medium' | 'high' | null) => {
    switch (priority) {
      case 'high':
        return 'text-danger font-medium';
      case 'medium':
        return 'text-warning font-medium';
      case 'low':
        return 'text-success';
      default:
        return 'text-secondary-foreground';
    }
  };

  // 優先度に応じたラベルを返す関数
  const getPriorityLabel = (priority: 'low' | 'medium' | 'high' | null) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '';
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 bg-card-bg rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">シンプルTODO管理アプリ</h1>
        <ThemeToggle />
      </div>
      
      <div className="mb-6 space-y-2">
        <div className="flex space-x-2">
          <input
            type="text"
            className="flex-1 px-4 py-2 border rounded-l text-foreground bg-input-bg border-input-border focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="新しいタスクを入力..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-r hover:bg-primary-hover transition"
            onClick={addTodo}
          >
            追加
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            className="px-4 py-2 border rounded text-foreground bg-input-bg border-input-border focus:outline-none focus:ring-2 focus:ring-primary"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          
          <select
            className="px-4 py-2 border rounded text-foreground bg-input-bg border-input-border focus:outline-none focus:ring-2 focus:ring-primary"
            value={priority || ''}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | null)}
          >
            <option value="">優先度を選択</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-l ${
              currentFilter === 'all' 
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary-hover'
            } transition`}
            onClick={() => setCurrentFilter('all')}
          >
            すべて
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-l border-r ${
              currentFilter === 'active' 
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary-hover'
            } transition`}
            onClick={() => setCurrentFilter('active')}
          >
            未完了
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-r ${
              currentFilter === 'completed' 
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary-hover'
            } transition`}
            onClick={() => setCurrentFilter('completed')}
          >
            完了済み
          </button>
        </div>
      </div>
      
      <div className="mb-6 rounded-md overflow-hidden border border-input-border">
        {filteredTodos.length === 0 ? (
          <div className="py-8 text-center text-secondary-foreground">
            表示するタスクがありません
          </div>
        ) : (
          <ul className="divide-y divide-input-border">
            {filteredTodos.map(todo => (
              <li 
                key={todo.id} 
                className={`flex items-center py-3 px-4 ${
                  todo.completed ? 'bg-secondary bg-opacity-30' : ''
                } ${
                  isOverdue(todo.dueDate) && !todo.completed ? 'bg-overdue bg-opacity-30' : ''
                } hover:bg-opacity-40 transition-colors`}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodoStatus(todo.id)}
                  className="h-5 w-5 text-primary rounded mr-3 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className={`${todo.completed ? 'line-through text-secondary-foreground' : 'text-foreground'}`}>
                    {todo.text}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1 text-sm">
                    {todo.dueDate && (
                      <span className={`${
                        isOverdue(todo.dueDate) && !todo.completed
                          ? 'text-danger font-medium'
                          : 'text-secondary-foreground'
                      }`}>
                        期限: {formatDate(todo.dueDate)}
                        {isOverdue(todo.dueDate) && !todo.completed && ' (期限切れ)'}
                      </span>
                    )}
                    
                    {todo.priority && (
                      <span className={`${getPriorityStyle(todo.priority)}`}>
                        優先度: {getPriorityLabel(todo.priority)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="ml-2 p-1 text-danger hover:text-danger-hover transition-colors rounded-full hover:bg-secondary"
                  aria-label="タスクを削除"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="flex justify-between items-center text-sm text-secondary-foreground">
        <span>{activeTodosCount} 個のタスクが残っています</span>
        {todos.some(todo => todo.completed) && (
          <button
            onClick={clearCompleted}
            className="px-3 py-1 text-secondary-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
          >
            完了したタスクを削除
          </button>
        )}
      </div>
    </div>
  );
}
