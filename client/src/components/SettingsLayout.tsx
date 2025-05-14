import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Settings, Database, BookCopy, Shield, User } from 'lucide-react';

interface SettingsLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function SettingsLayout({
  title,
  description,
  children,
}: SettingsLayoutProps) {
  const [location] = useLocation();
  
  const settingsNavItems = [
    {
      title: 'Account',
      href: '/settings/account',
      icon: <User className="h-4 w-4" />,
    },
    {
      title: 'Data Sources',
      href: '/settings/data-sources',
      icon: <Database className="h-4 w-4" />,
    },
    {
      title: 'Content Management',
      href: '/settings/content',
      icon: <BookCopy className="h-4 w-4" />,
    },
    {
      title: 'Admin',
      href: '/settings/admin',
      icon: <Shield className="h-4 w-4" />,
    },
  ];

  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <div className="flex items-center mb-6">
            <Settings className="h-5 w-5 mr-2" />
            <h3 className="font-semibold">Settings</h3>
          </div>
          <nav className="flex flex-col space-y-1">
            {settingsNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  location === item.href
                    ? 'bg-muted hover:bg-muted'
                    : 'hover:bg-transparent hover:underline',
                  'justify-start'
                )}
              >
                {item.icon}
                <span className="ml-2">{item.title}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1 lg:max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-2">{description}</p>
          </div>
          <div className="border rounded-lg p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}