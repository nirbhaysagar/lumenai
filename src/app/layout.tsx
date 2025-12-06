import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { TaskReminderWatcher } from '@/components/TaskReminderWatcher';
import { GlobalCaptureTrigger } from '@/components/shared/GlobalCaptureTrigger';
import { GlobalSearch } from '@/components/dashboard/GlobalSearch';
import Providers from './providers';

const ibm = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  variable: '--font-ibm'
});

export const metadata: Metadata = {
  title: 'Lumen AI',
  description: 'Your second brain, supercharged.',
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={ibm.className} suppressHydrationWarning>
        <Providers>
          {children}
          <GlobalCaptureTrigger />
          <GlobalSearch />
          <TaskReminderWatcher />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
