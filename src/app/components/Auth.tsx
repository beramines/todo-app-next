'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('アカウント登録メールを送信しました。メールを確認してください。');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-4 bg-card-bg rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-foreground">
        {mode === 'signin' ? 'ログイン' : 'アカウント登録'}
      </h2>
      
      <form onSubmit={handleAuth} className="w-full space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary-foreground mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded text-foreground bg-input-bg border-input-border focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-secondary-foreground mb-1">
            パスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded text-foreground bg-input-bg border-input-border focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-hover transition"
          disabled={loading}
        >
          {loading ? '処理中...' : mode === 'signin' ? 'ログイン' : 'アカウント登録'}
        </button>
      </form>
      
      <p className="text-sm text-secondary-foreground">
        {mode === 'signin' ? 'アカウントをお持ちでない方は' : 'すでにアカウントをお持ちの方は'}
        <button
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="ml-1 text-primary hover:underline"
        >
          {mode === 'signin' ? 'こちら' : 'こちら'}
        </button>
      </p>
    </div>
  );
}
