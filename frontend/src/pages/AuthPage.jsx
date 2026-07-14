import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, resetUserPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isReset) {
        const res = await resetUserPassword(email, newPassword);
        if (res.success) {
          setMessage(res.message);
          setIsReset(false);
          setIsLogin(true);
        } else {
          setError(res.message);
        }
      } else if (isLogin) {
        const res = await login(email, password); // email field doubles as username
        if (res.success) {
          navigate('/');
        } else {
          setError(res.message);
        }
      } else {
        const res = await register(username, email, password);
        if (res.success) {
          navigate('/');
        } else {
          setError(res.message);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-instagram-gray p-4 md:p-8">
      <div className="flex w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-instagram-border">
        {/* Left Side - Visual Panel (Hidden on Mobile) */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-tr from-purple-600 via-pink-500 to-yellow-500 justify-center items-center p-12 text-white relative">
          <div className="z-10 text-center flex flex-col items-center">
            <h1 className="text-4xl font-extrabold tracking-wider font-sans italic mb-4">OrySnap</h1>
            <p className="text-lg opacity-90 mb-8 max-w-xs">
              Connect with friends, share your moments, and explore the world in real-time.
            </p>
            {/* Phone Screen Mockup */}
            <div className="w-64 h-[350px] bg-black rounded-3xl p-2 border-4 border-gray-800 shadow-2xl relative overflow-hidden">
              <div className="w-full h-full bg-white rounded-2xl overflow-hidden flex flex-col justify-between">
                <div className="h-6 w-full border-b border-gray-100 flex items-center justify-between px-3">
                  <div className="text-[10px] text-gray-500 font-semibold">9:41</div>
                  <div className="w-16 h-3 bg-gray-200 rounded-full"></div>
                </div>
                <div className="flex-1 p-2 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500"></div>
                    <div className="w-12 h-2.5 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-xl relative overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300" 
                      alt="mockup post"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="w-8 h-2.5 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="h-8 w-full border-t border-gray-100 flex items-center justify-around">
                  <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                  <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                  <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative glowing circles */}
          <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Right Side - Form Panel */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold tracking-wider font-sans italic md:hidden bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-3">
                OrySnap
              </h2>
              <h3 className="text-2xl font-bold text-gray-900">
                {isReset ? 'Reset Password' : isLogin ? 'Sign In' : 'Create Account'}
              </h3>
              <p className="text-gray-500 text-sm mt-1.5">
                {isReset
                  ? 'Enter your email to secure your account'
                  : isLogin
                  ? 'Welcome back! Log in to see updates'
                  : 'Join OrySnap to connect with friends'}
              </p>
            </div>

            {/* Error & Success Alerts */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-4 text-center font-medium">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-xl mb-4 text-center font-medium">
                {message}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {!isLogin && !isReset && (
                <div className="flex flex-col">
                  <input
                    type="text"
                    required
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-sm bg-gray-50"
                  />
                </div>
              )}

              <div className="flex flex-col">
                <input
                  type={isReset ? 'email' : 'text'}
                  required
                  placeholder={isReset ? 'Email address' : 'Username or Email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-sm bg-gray-50"
                />
              </div>

              {!isReset && (
                <div className="flex flex-col">
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-sm bg-gray-50"
                  />
                </div>
              )}

              {isReset && (
                <div className="flex flex-col">
                  <input
                    type="password"
                    required
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-sm bg-gray-50"
                  />
                </div>
              )}

              {isLogin && !isReset && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setIsReset(true);
                      setError('');
                      setMessage('');
                    }}
                    className="text-xs font-semibold text-pink-500 hover:text-pink-600 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : isReset ? 'Reset Password' : isLogin ? 'Log In' : 'Sign Up'}
              </button>
            </form>

            {/* Form Toggle Links */}
            <div className="text-center mt-6">
              {isReset ? (
                <button
                  onClick={() => {
                    setIsReset(false);
                    setIsLogin(true);
                    setError('');
                    setMessage('');
                  }}
                  className="text-sm font-semibold text-pink-500 hover:underline"
                >
                  Back to Sign In
                </button>
              ) : (
                <p className="text-sm text-gray-600">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                      setMessage('');
                    }}
                    className="font-bold text-pink-500 hover:underline"
                  >
                    {isLogin ? 'Sign Up' : 'Log In'}
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
