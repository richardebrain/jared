import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function SimpleBusinessRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    adminPassword: '',
    contactEmail: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/register-business-simplified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Registration successful!",
          description: "Your school has been registered successfully."
        });
        
        // Redirect to success page
        window.location.href = '/registration-success';
      } else {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: data.message || "An error occurred during registration."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: "Unable to complete registration. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Register Your School
          </CardTitle>
          <CardDescription>
            Join MentorMe's professional development platform for early childhood educators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">School Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  placeholder="Raising Arizona Preschool"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactEmail">School Contact Email</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="contact@yourschool.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminPassword">School Admin Password</Label>
                <Input
                  id="adminPassword"
                  name="adminPassword"
                  type="password"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
                <p className="text-sm text-gray-500">Must be at least 8 characters</p>
              </div>
            </div>
            
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Owner Account Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Jane"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Smith"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Personal Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="jane_smith"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
                <p className="text-sm text-gray-500">Must be at least 8 characters</p>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register School'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}