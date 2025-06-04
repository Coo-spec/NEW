'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">MegaClone</Link>
      <div className="flex gap-4 items-center">
        {status === 'loading' ? (
          <span>Loading...</span>
        ) : session ? (
          <>
            <span className="text-gray-600">Hi, {session.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/auth/signin" className="text-blue-600">Login</Link>
        )}
      </div>
    </nav>
  );
}