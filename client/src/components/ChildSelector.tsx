import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Eye, Share } from 'lucide-react';
import { Link } from 'wouter';

interface Child {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  schoolId: number;
  sharedWithSchool: boolean;
  isActive: boolean;
  createdBy: number;
  referencePhotoUrl?: string;
}

interface ChildSelectorProps {
  children: Child[];
  selectedChild: number | null;
  onSelect: (id: number) => void;
  showNewChildDialog: boolean;
  setShowNewChildDialog: (open: boolean) => void;
  newChildData: {
    firstName: string;
    lastName: string;
    birthDate: string;
    referencePhotoUrl: string;
  };
  setNewChildData: (data: any) => void;
  createChildMutation: any;
  updateSharingMutation: any;
}

export default function ChildSelector({
  children,
  selectedChild,
  onSelect,
  showNewChildDialog,
  setShowNewChildDialog,
  newChildData,
  setNewChildData,
  createChildMutation,
  updateSharingMutation
}: ChildSelectorProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            Children
          </CardTitle>
          <CardDescription>Choose a child to create portfolio entries</CardDescription>
        </div>
        <Dialog open={showNewChildDialog} onOpenChange={setShowNewChildDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Child
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Child</DialogTitle>
              <DialogDescription>Add a new child to your class</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newChildData.firstName}
                  onChange={(e) => setNewChildData((prev: any) => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newChildData.lastName}
                  onChange={(e) => setNewChildData((prev: any) => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="birthDate">Date of Birth</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={newChildData.birthDate}
                  onChange={(e) => setNewChildData((prev: any) => ({ ...prev, birthDate: e.target.value }))}
                />
              </div>
              {/* Reference photo upload can be added here if needed */}
              <Button
                onClick={() => createChildMutation.mutate(newChildData)}
                disabled={!newChildData.firstName || !newChildData.lastName || createChildMutation.isPending}
                className="w-full"
              >
                {createChildMutation.isPending ? 'Adding...' : 'Add Child'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {children.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No children in your class yet. Add a child to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {children.map((child: Child) => (
              <div key={child.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Button
                    variant={selectedChild === child.id ? "default" : "outline"}
                    className="flex-grow justify-start mr-2"
                    onClick={() => onSelect(child.id)}
                  >
                    {child.firstName} {child.lastName}
                  </Button>
                  <Link href={`/children/${child.id}`}>
                    <Button variant="ghost" size="sm" className="p-2">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Share className="h-3 w-3" />
                    <span>Share with school teachers</span>
                  </div>
                  <Switch
                    checked={child.sharedWithSchool}
                    onCheckedChange={(checked) => 
                      updateSharingMutation.mutate({
                        childId: child.id,
                        sharedWithSchool: checked
                      })
                    }
                    disabled={updateSharingMutation.isPending}
                  />
                </div>
                {child.sharedWithSchool && (
                  <div className="mt-1 text-xs text-green-600">
                    Shared with your school
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 