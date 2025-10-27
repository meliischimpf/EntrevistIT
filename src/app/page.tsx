'use client';

import dynamic from 'next/dynamic';

// Importación dinámica para evitar problemas con el renderizado del lado del servidor
const Interviewer = dynamic(
  () => import('@/components/Interviewer/Interviewer'),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <Interviewer />
    </main>
  );
}