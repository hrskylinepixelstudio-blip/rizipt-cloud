import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Boxes } from 'lucide-react';
import TextField from '../../components/TextField.jsx';
import Button from '../../components/Button.jsx';
import { registerCompany } from '../../services/authService.js';
import { useAuthStore } from '../../store/authStore.js';

const schema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  fullName: z.string().min(2, 'Your name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone number').optional().or(z.literal('')),
  password: z.string().min(8, 'At least 8 characters'),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const loginSuccess = useAuthStore((s) => s.loginSuccess);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const result = await registerCompany(values);
      loginSuccess(result);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Unable to create account. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Boxes className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">Create your company</h1>
          <p className="text-sm text-slate-500">Start your 14-day free trial</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {serverError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {serverError}
            </p>
          )}
          <TextField
            id="companyName"
            label="Company name"
            placeholder="Your Business Pvt Ltd"
            error={errors.companyName?.message}
            {...register('companyName')}
          />
          <TextField
            id="fullName"
            label="Your full name"
            placeholder="Ramesh Kumar"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <TextField
            id="email"
            label="Email"
            type="email"
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <TextField
            id="phone"
            label="Phone (optional)"
            placeholder="98765 43210"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <TextField
            id="password"
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
