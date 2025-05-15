import React from 'react';
import SettingsLayout from '@/components/SettingsLayout';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AccountPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return (
    <SettingsLayout
      title="Account Settings"
      description="Manage your account settings and preferences"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Profile</h3>
          <p className="text-sm text-muted-foreground">
            This is how others will see you on the platform
          </p>
        </div>
        
        <div className="grid gap-6">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3 flex flex-col justify-center">
              <div className="text-sm font-medium">Name</div>
            </div>
            <div className="col-span-9">
              <div className="rounded-md border border-input px-3 py-2">
                {user?.firstName} {user?.lastName}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3 flex flex-col justify-center">
              <div className="text-sm font-medium">Username</div>
            </div>
            <div className="col-span-9">
              <div className="rounded-md border border-input px-3 py-2">
                {user?.username || 'Not available'}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3 flex flex-col justify-center">
              <div className="text-sm font-medium">Email</div>
            </div>
            <div className="col-span-9">
              <div className="rounded-md border border-input px-3 py-2">
                {user?.email || 'Not available'}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3 flex flex-col justify-center">
              <div className="text-sm font-medium">Role</div>
            </div>
            <div className="col-span-9">
              <div className="rounded-md border border-input px-3 py-2">
                {user?.role || 'Teacher'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button
            onClick={() => 
              toast({
                title: "Coming Soon",
                description: "Profile editing will be available in a future update."
              })
            }
          >
            Update Profile
          </Button>
        </div>
      </div>
    </SettingsLayout>
  );
}