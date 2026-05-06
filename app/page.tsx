import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { LandingContent } from './_components/landing-content';

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    redirect('/chat');
  }

  return <LandingContent />;
}
