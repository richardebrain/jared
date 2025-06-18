import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeacherECEProfile } from "@/components/TeacherECEProfile";
import { GraduationCap, Users, Calendar, TrendingUp, Download } from "lucide-react";

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  level: number;
  points: number;
  isAdmin: boolean;
  isSchoolAdmin: boolean;
}

interface SchoolData {
  school: {
    id: number;
    name: string;
  };
}

interface TeachersData {
  count: number;
  teachers: Teacher[];
}

export default function SchoolECETracking() {
  const { schoolId } = useParams();
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  
  const { data: schoolData } = useQuery<SchoolData>({
    queryKey: ["/api/schools", schoolId],
    enabled: !!schoolId
  });
  
  const { data: teachersData, isLoading: teachersLoading } = useQuery<TeachersData>({
    queryKey: ["/api/schools", schoolId, "teachers"],
    enabled: !!schoolId
  });

  if (teachersLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const teachers = teachersData?.teachers || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-green-600" />
            ECE Training Hours Tracking
          </h1>
          <p className="text-gray-600 mt-2">
            {schoolData?.school?.name} - Professional Development Compliance
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">School Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Teachers</TabsTrigger>
        </TabsList>

        {/* School Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* School Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{teachers.length}</div>
                <div className="text-sm text-gray-600">Total Teachers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <GraduationCap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">-</div>
                <div className="text-sm text-gray-600">Total ECE Hours</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">-</div>
                <div className="text-sm text-gray-600">This Month</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">-</div>
                <div className="text-sm text-gray-600">Compliance Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* Teachers Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Teacher ECE Hours Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {teacher.firstName[0]}{teacher.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{teacher.firstName} {teacher.lastName}</h3>
                        <p className="text-sm text-gray-600">{teacher.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {teacher.isSchoolAdmin && (
                            <Badge variant="secondary" className="text-xs">School Admin</Badge>
                          )}
                          {teacher.isAdmin && (
                            <Badge variant="secondary" className="text-xs">Admin</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-medium">- hrs</div>
                      <div className="text-sm text-gray-600">ECE Hours</div>
                    </div>
                  </div>
                ))}
                {teachers.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No teachers found for this school.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual Teachers Tab */}
        <TabsContent value="individual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Teacher Selection Sidebar */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Select Teacher</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {teachers.map((teacher) => (
                  <Button
                    key={teacher.id}
                    variant={selectedTeacher === teacher.id ? "default" : "outline"}
                    className="w-full justify-start text-left"
                    onClick={() => setSelectedTeacher(teacher.id)}
                  >
                    <div className="truncate">
                      {teacher.firstName} {teacher.lastName}
                    </div>
                  </Button>
                ))}
                {teachers.length === 0 && (
                  <p className="text-gray-500 text-sm">No teachers available</p>
                )}
              </CardContent>
            </Card>

            {/* Teacher ECE Profile */}
            <div className="lg:col-span-3">
              {selectedTeacher ? (
                <TeacherECEProfile teacherId={selectedTeacher} />
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-500 mb-2">
                      Select a Teacher
                    </h3>
                    <p className="text-gray-400">
                      Choose a teacher from the sidebar to view their ECE training hours and progress.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}