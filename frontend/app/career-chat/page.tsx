'use client';

import { Suspense } from 'react';
import CareerChat from '@/components/CareerChat';
import { useUser } from '@/hooks/useUser';

function ChatFallback() {
  return (
    <div className="flex h-[50vh] items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-500">
      Loading chat…
    </div>
  );
}

export default function CareerChatPage() {

  const { isLoggedIn, loading } = useUser();

  // Loading state
  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  // Login Gate
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fc] px-6">
        <div className="w-full max-w-lg rounded-[20px] border border-[#edf1f7] bg-white p-6 shadow-sm text-center">

          <h1 className="text-2xl font-bold text-[#101828]">
            Career Chat
          </h1>

          <p className="mt-2 text-[#667085]">
            Please log in to access AI career conversations.
          </p>

          <a
            href="/login?next=/career-chat"
            className="inline-flex mt-6 h-10 items-center justify-center rounded-xl bg-[#f6c744] px-5 text-sm font-semibold text-black hover:opacity-90"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // REAL PAGE
  return (
    <div className="relative h-full w-full min-h-[75vh] rounded-[24px] overflow-hidden border border-white shadow-xl">

      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=2070"
          alt="Career Background"
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 h-full w-full p-2 lg:p-4">
        <Suspense fallback={<ChatFallback />}>
          <CareerChat />
        </Suspense>
      </div>
    </div>
  );
}
