'use client';

import { useEffect, useState } from 'react';
import ThemeToggle from './ui/ThemeToggle';
import Auth from './Auth';
import Loading from './ui/Loading';
import { supabase } from '../../../lib/supabaseClient';

// Todo型の定義を更新
interface Todo {
  id: string;
  user_id: string;
  text: string;
  completed: boolean;
  due_date: string | null;  // Supabaseでは通常スネークケースが使われるため
  priority: 'low' | 'medium' | 'high' | null;
  created_at?: string;
  updated_at?: string;
}

// フィルタの種類を定義
type FilterType = 'all' | 'active' | 'completed';

// 開発環境かどうかを判定する関数
const isDevelopment = () => {
  return process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview';
};

export default function TodoApp() {
  // 認証状態の管理を追加
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // TODOリストの状態
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  
  // 認証状態の監視またはデベロップモードでのダミーユーザー設定
  useEffect(() => {
    if (isDevelopment()) {
      // 開発環境では仮想ユーザーを設定してローカルストレージを使用
      const dummyUser = { id: 'dev-user-id', email: 'dev@example.com' };
      setUser(dummyUser);
      
      // ローカルストレージからタスクを読み込む（開発環境用）
      const savedTodos = localStorage.getItem('todos');
      if (savedTodos) {
        try {
          setTodos(JSON.parse(savedTodos));
        } catch (e) {
          console.error('Error parsing saved todos:', e);
        }
      }
      setLoading(false);
    } else {
      // 本番環境ではSupabase認証を使用
      const fetchSession = async () => {
        setLoading(true);
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          setUser(session?.user || null);
          
          if (session?.user) {
            await fetchTodos(session.user.id);
          }
        } catch (error) {
          console.error('Error getting session:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchSession();
      
      // 認証状態の変化を監視
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setUser(session?.user || null);
          
          if (session?.user) {
            await fetchTodos(session.user.id);
          } else {
            setTodos([]);
          }
        }
      );
      
      return () => {
        subscription?.unsubscribe();
      };
    }
  }, []);
  
  // データ変更時、開発環境ではローカルストレージに保存
  useEffect(() => {
    if (isDevelopment() && todos.length > 0) {
      localStorage.setItem('todos', JSON.stringify(todos));
    }
  }, [todos]);
  
  // Supabaseからタスクを取得またはダミーデータを返す
  const fetchTodos = async (userId: string) => {
    if (isDevelopment()) {
      // 開発環境では何もしない（すでにローカルストレージから読み込み済み）
      return;
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTodos(data || []);
    } catch (error: any) {
      console.error('Error fetching todos:', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // タスク追加処理
  const addTodo = async () => {
    if (!user || !inputText.trim()) return;
    
    try {
      setLoading(true);
      
      const newTodo: Todo = {
        id: Date.now().toString(), // 開発環境ではローカルで生成したIDを使用
        user_id: user.id,
        text: inputText.trim(),
        completed: false,
        due_date: dueDate || null,
        priority: priority,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      if (isDevelopment()) {
        // 開発環境ではそのままステートを更新
        setTodos([newTodo, ...todos]);
        setInputText('');
        setDueDate('');
        setPriority(null);
        setLoading(false);
        return;
      }
      
      // 本番環境ではSupabaseに保存
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          user_id: user.id,
          text: inputText.trim(),
          completed: false,
          due_date: dueDate || null,
          priority: priority
        }])
        .select();
      
      if (error) throw error;
      
      if (data) {
        setTodos([...data, ...todos]);
        setInputText('');
        setDueDate('');
        setPriority(null);
      }
    } catch (error: any) {
      console.error('Error adding todo:', error.message);
      alert(`タスクの追加に失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Enterキーでも追加できるようにする
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };
  
  // TODOの完了状態を切り替え
  const toggleTodoStatus = async (id: string) => {
    try {
      const todoToUpdate = todos.find(todo => todo.id === id);
      if (!todoToUpdate) return;
      
      setLoading(true);
      
      if (isDevelopment()) {
        // 開発環境ではそのままステートを更新
        setTodos(
          todos.map(todo => 
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          )
        );
        setLoading(false);
        return;
      }
      
      // 本番環境ではSupabaseを使用
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !todoToUpdate.completed })
        .eq('id', id);
      
      if (error) throw error;
      
      // ローカルステートを更新
      setTodos(
        todos.map(todo => 
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        )
      );
    } catch (error: any) {
      console.error('Error updating todo:', error.message);
      alert(`タスクの更新に失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // TODOを削除
  const deleteTodo = async (id: string) => {
    try {
      setLoading(true);
      
      if (isDevelopment()) {
        // 開発環境ではそのままステートを更新
        setTodos(todos.filter(todo => todo.id !== id));
        setLoading(false);
        return;
      }
      
      // 本番環境ではSupabaseを使用
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // ローカルステートを更新
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error: any) {
      console.error('Error deleting todo:', error.message);
      alert(`タスクの削除に失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 完了したTODOをすべて削除
  const clearCompleted = async () => {
    try {
      const completedIds = todos
        .filter(todo => todo.completed)
        .map(todo => todo.id);
      
      if (completedIds.length === 0) return;
      
      setLoading(true);
      
      if (isDevelopment()) {
        // 開発環境ではそのままステートを更新
        setTodos(todos.filter(todo => !todo.completed));
        setLoading(false);
        return;
      }
      
      // 本番環境ではSupabaseを使用
      // 一度に大量の削除を行うことができないため、一つずつ削除処理を行う
      for (const id of completedIds) {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }
      
      // ローカルステートを更新
      setTodos(todos.filter(todo => !todo.completed));
    } catch (error: any) {
      console.error('Error clearing completed todos:', error.message);
      alert(`完了したタスクの削除に失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
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
      
      {/* ユーザーがログインしていない場合は認証コンポーネントを表示（本番環境のみ） */}
      {!user && !isDevelopment() ? (
        <Auth />
      ) : (
        <>
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
                className="px-4 py-2 bg-primary text-primary-foreground rounded-r hover:bg-primary-hover cursor-pointer transition-all duration-300 ease-in-out"
                onClick={addTodo}
                disabled={loading}
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
                } cursor-pointer transition-all duration-300 ease-in-out`}
                onClick={() => setCurrentFilter('all')}
              >
                すべて
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium border-l border-r ${
                  currentFilter === 'active' 
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary-hover'
                } cursor-pointer transition-all duration-300 ease-in-out`}
                onClick={() => setCurrentFilter('active')}
              >
                未完了
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-r ${
                  currentFilter === 'completed' 
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary-hover'
                } cursor-pointer transition-all duration-300 ease-in-out`}
                onClick={() => setCurrentFilter('completed')}
              >
                完了済み
              </button>
            </div>
          </div>
          
          {loading ? (
            <Loading />
          ) : (
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
                        isOverdue(todo.due_date) && !todo.completed ? 'bg-overdue bg-opacity-30' : ''
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
                          {todo.due_date && (
                            <span className={`${
                              isOverdue(todo.due_date) && !todo.completed
                                ? 'text-danger font-medium'
                                : 'text-secondary-foreground'
                            }`}>
                              期限: {formatDate(todo.due_date)}
                              {isOverdue(todo.due_date) && !todo.completed && ' (期限切れ)'}
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
                        className="ml-2 p-1 text-danger hover:text-danger-hover cursor-pointer transition-all duration-300 ease-in-out rounded-full hover:bg-secondary"
                        aria-label="タスクを削除"
                        disabled={loading}
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
          )}
          
          <div className="flex justify-between items-center text-sm text-secondary-foreground">
            <span>{activeTodosCount} 個のタスクが残っています</span>
            {todos.some(todo => todo.completed) && (
              <button
                onClick={clearCompleted}
                className="px-3 py-1 text-secondary-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-all duration-300 ease-in-out rounded"
                disabled={loading}
              >
                完了したタスクを削除
              </button>
            )}
          </div>
          
          {/* ログアウトボタン（開発環境では非表示） */}
          {!isDevelopment() && (
            <div className="mt-8 text-center">
              <button
                onClick={() => supabase.auth.signOut()}
                className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary-hover cursor-pointer transition-all duration-300 ease-in-out"
              >
                ログアウト
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
