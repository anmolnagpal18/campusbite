import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardRoute } from '../components/ProtectedRoute';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import ROUTES from '../routes/constants';
import toast from 'react-hot-toast';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const loggedUser = await login(data.email, data.password);
      toast.success('Logged in successfully!');
      
      if (loggedUser.status === 'PENDING' || loggedUser.status === 'REJECTED') {
        navigate(ROUTES.APPROVAL);
      } else {
        navigate(getDashboardRoute(loggedUser.role));
      }
    } catch (err) {
      const responseData = err.response?.data;
      const errorMsg = responseData?.message || 'Invalid email or password.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0a14] px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full glass-card p-8 md:p-10 rounded-3xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 font-extrabold text-white text-xl shadow-lg shadow-purple-500/20 mb-3">
            CB
          </div>
          <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-sm mt-2">Sign in to your CampusBite account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            icon={<Mail className="h-5 w-5 text-gray-400" />}
            placeholder="you@campusfood.com"
            error={errors.email?.message}
            {...register('email', { 
              required: 'Email is required',
              pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
            })}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={<Lock className="h-5 w-5 text-gray-400" />}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-[38px] text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <Button
            type="submit"
            loading={loading}
            icon={<LogIn className="h-5 w-5" />}
            className="w-full"
          >
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-8">
          Don't have an account?{' '}
          <Link to={ROUTES.SIGNUP} className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-200">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
