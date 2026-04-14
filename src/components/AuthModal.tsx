import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../i18n/context';

type Mode = 'login' | 'register' | 'forgot';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { locale } = useLocale();
  const isEn = locale === 'en';
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const reset = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setMessage('');
  };

  const switchMode = (m: Mode) => {
    reset();
    setMode(m);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError(isEn ? 'Please fill in all fields' : '请填写所有字段');
      return;
    }
    setSubmitting(true);
    const { error: err } = await signInWithEmail(email, password);
    setSubmitting(false);
    if (err) {
      setError(err);
    } else {
      onClose();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError(isEn ? 'Please fill in all fields' : '请填写所有字段');
      return;
    }
    if (password.length < 6) {
      setError(isEn ? 'Password must be at least 6 characters' : '密码至少需要6个字符');
      return;
    }
    if (password !== confirmPassword) {
      setError(isEn ? 'Passwords do not match' : '两次密码不一致');
      return;
    }
    setSubmitting(true);
    const { error: err } = await signUpWithEmail(email, password);
    setSubmitting(false);
    if (err) {
      setError(err);
    } else {
      setMessage(isEn ? 'Check your email to confirm your account' : '请查看邮件以确认你的账号');
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError(isEn ? 'Please enter your email' : '请输入邮箱地址');
      return;
    }
    setSubmitting(true);
    const { error: err } = await resetPassword(email);
    setSubmitting(false);
    if (err) {
      setError(err);
    } else {
      setMessage(isEn ? 'Password reset link sent to your email' : '重置密码链接已发送至你的邮箱');
    }
  };

  const title = {
    login: isEn ? 'Sign In' : '登录',
    register: isEn ? 'Create Account' : '注册账号',
    forgot: isEn ? 'Reset Password' : '重置密码',
  }[mode];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Google OAuth */}
        {mode !== 'forgot' && (
          <>
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {isEn ? 'Continue with Google' : '使用 Google 登录'}
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
              <span className="text-xs text-gray-400">{isEn ? 'or' : '或'}</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
            </div>
          </>
        )}

        {/* Form */}
        <form onSubmit={mode === 'login' ? handleEmailLogin : mode === 'register' ? handleRegister : handleForgot}>
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={isEn ? 'Email address' : '邮箱地址'}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-400/30"
              autoComplete="email"
            />
            {mode !== 'forgot' && (
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isEn ? 'Password' : '密码'}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-400/30"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            )}
            {mode === 'register' && (
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder={isEn ? 'Confirm password' : '确认密码'}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-400/30"
                autoComplete="new-password"
              />
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          {message && <p className="mt-3 text-sm text-green-600 dark:text-green-400">{message}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting
              ? (isEn ? 'Please wait...' : '请稍候...')
              : mode === 'login'
                ? (isEn ? 'Sign In' : '登录')
                : mode === 'register'
                  ? (isEn ? 'Create Account' : '注册')
                  : (isEn ? 'Send Reset Link' : '发送重置链接')}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-4 text-center text-xs text-gray-400 space-y-1.5">
          {mode === 'login' && (
            <>
              <button onClick={() => switchMode('forgot')} className="hover:text-gray-600 cursor-pointer">
                {isEn ? 'Forgot password?' : '忘记密码？'}
              </button>
              <div>
                {isEn ? "Don't have an account? " : '没有账号？ '}
                <button onClick={() => switchMode('register')} className="text-gray-600 dark:text-gray-300 font-medium hover:underline cursor-pointer">
                  {isEn ? 'Sign up' : '注册'}
                </button>
              </div>
            </>
          )}
          {mode === 'register' && (
            <div>
              {isEn ? 'Already have an account? ' : '已有账号？ '}
              <button onClick={() => switchMode('login')} className="text-gray-600 dark:text-gray-300 font-medium hover:underline cursor-pointer">
                {isEn ? 'Sign in' : '登录'}
              </button>
            </div>
          )}
          {mode === 'forgot' && (
            <button onClick={() => switchMode('login')} className="hover:text-gray-600 cursor-pointer">
              {isEn ? 'Back to sign in' : '返回登录'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
