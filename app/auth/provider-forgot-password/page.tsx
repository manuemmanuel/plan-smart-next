'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, Building2 } from 'lucide-react';
import { providerSupabase } from '@/lib/supabase2';
import { toast } from 'sonner';

export default function ProviderForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await providerSupabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/provider-reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Password reset link sent to your email');
      setEmail('');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/" className="flex justify-center items-center group mb-12">
            <div className="relative">
              <CalendarCheck className="h-12 w-12 text-[#f08b8b] transform group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="ml-3 text-2xl tracking-tight text-gray-900">
              <span className="font-bold">Plan</span>
              <span className="text-[#f08b8b]">Smart</span>
            </span>
          </Link>

          <div className="flex items-center justify-center mb-6 space-x-2">
            <Building2 className="h-6 w-6 text-[#f08b8b]" />
            <h2 className="text-2xl font-semibold text-gray-900">Service Provider Portal</h2>
          </div>

          <h2 className="text-center text-3xl font-bold text-gray-900 mb-3">
            Reset your password
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <div className="bg-white p-8 shadow-lg rounded-xl border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#f08b8b] focus:border-[#f08b8b] bg-white/50"
                  placeholder="Enter your email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-[#f08b8b] hover:bg-[#d67676] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f08b8b] transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>

              <div className="text-center">
                <Link 
                  href="/auth/provider-signin" 
                  className="text-sm text-[#f08b8b] hover:text-[#d67676]"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}