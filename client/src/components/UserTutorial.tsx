import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  BookOpen, 
  Users, 
  Award, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  X,
  GraduationCap,
  Target,
  Clock,
  Star
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  screenshot?: string;
  action?: {
    text: string;
    href?: string;
    onClick?: () => void;
  };
  userTypes: ('teacher' | 'admin' | 'school_admin')[];
}

interface UserTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'teacher' | 'admin' | 'school_admin';
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to MentorMe ECE',
    description: 'Your professional development platform for early childhood education. Let\'s explore the key features that will enhance your teaching journey.',
    icon: <GraduationCap className="h-6 w-6 text-blue-600" />,
    screenshot: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjhmOWZhIi8+CjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjM2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzM5ODNmNiIgcng9IjgiLz4KPHN2ZyB4PSIzNSIgeT0iMzUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCI+CiAgPHBhdGggZD0iTTEwIDIwSDE1TDIwIDEwTDI1IDIwSDMwVjI1SDE1VjMwSDEwVjI1SDVWMjBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPHRleHQgeD0iNzUiIHk9IjU1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSI+TWVudG9yTWUgRUNFPC90ZXh0Pgo8cmVjdCB4PSIyMCIgeT0iMTAwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjE4MCIgZmlsbD0id2hpdGUiIHJ4PSI4IiBzdHJva2U9IiNlNWU3ZWIiLz4KPHR5eHQgeD0iMjAwIiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMxZjJkM2QiIHRleHQtYW5jaG9yPSJtaWRkbGUiPldlbGNvbWUgVG8geW91ciBsZWFybmluZyBqb3VybmV5PC90ZXh0Pgo8dGV4dCB4PSIyMDAiIHk9IjE3MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNmI3Mjg2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Qcm9mZXNzaW9uYWwgZGV2ZWxvcG1lbnQgZm9yIEVDRSBlZHVjYXRvcnM8L3RleHQ+CjxyZWN0IHg9IjE1MCIgeT0iMjAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMzk4M2Y2IiByeD0iOCIvPgo8dGV4dCB4PSIyMDAiIHk9IjIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkdldCBTdGFydGVkPC90ZXh0Pgo8L3N2Zz4=',
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'dashboard',
    title: 'Your Learning Dashboard',
    description: 'Track your progress, view recommendations, and see your learning path. Your dashboard shows completed modules, streak status, and ECE hours.',
    icon: <BarChart3 className="h-6 w-6 text-green-600" />,
    screenshot: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjhmOWZhIi8+CjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjM2MCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzEwYjk4MSIgcng9IjgiLz4KPHR5eHQgeD0iMjAwIiB5PSI0NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkxlYXJuaW5nIERhc2hib2FyZDwvdGV4dD4KPHJlY3QgeD0iMjAiIHk9IjgwIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjgwIiBmaWxsPSJ3aGl0ZSIgcng9IjgiIHN0cm9rZT0iI2U1ZTdlYiIvPgo8dGV4dCB4PSI3NSIgeT0iMTA1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMWYyZDNkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TdHJlYWs8L3RleHQ+Cjx0ZXh0IHg9Ijc1IiB5PSIxMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMxMGI5ODEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPjUgZGF5czwvdGV4dD4KPHJlY3QgeD0iMTQ1IiB5PSI4MCIgd2lkdGg9IjExMCIgaGVpZ2h0PSI4MCIgZmlsbD0id2hpdGUiIHJ4PSI4IiBzdHJva2U9IiNlNWU3ZWIiLz4KPHR5eHQgeD0iMjAwIiB5PSIxMDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMxZjJkM2QiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVDRSBIb3VyczwvdGV4dD4KPHR5eHQgeD0iMjAwIiB5PSIxMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzOTgzZjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPjE1LzMwPC90ZXh0Pgo8cmVjdCB4PSIyNzAiIHk9IjgwIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjgwIiBmaWxsPSJ3aGl0ZSIgcng9IjgiIHN0cm9rZT0iI2U1ZTdlYiIvPgo8dGV4dCB4PSIzMjUiIHk9IjEwNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzFmMmQzZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UG9pbnRzPC90ZXh0Pgo8dGV4dCB4PSIzMjUiIHk9IjEzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI2Y1OWUwYiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+MjQ1PC90ZXh0Pgo8cmVjdCB4PSIyMCIgeT0iMTgwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjEwMCIgZmlsbD0id2hpdGUiIHJ4PSI4IiBzdHJva2U9IiNlNWU3ZWIiLz4KPHR5eHQgeD0iMzAiIHk9IjIwNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzFmMmQzZCI+UmVjZW50IEFjdGl2aXR5PC90ZXh0Pgo8Y2lyY2xlIGN4PSI1MCIgY3k9IjIzMCIgcj0iNSIgZmlsbD0iIzEwYjk4MSIvPgo8dGV4dCB4PSI3MCIgeT0iMjM1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2YjcyODYiPkNvbXBsZXRlZCBDbGFzc3Jvb20gTWFuYWdlbWVudCBNb2R1bGU8L3RleHQ+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMjUwIiByPSI1IiBmaWxsPSIjMzk4M2Y2Ii8+Cjx0ZXh0IHg9IjcwIiB5PSIyNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzZiNzI4NiI+U3RhcnRlZCBBc3Nlc3NtZW50PC90ZXh0Pgo8L3N2Zz4=',
    action: {
      text: 'View Dashboard',
      href: '/dashboard'
    },
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'modules',
    title: 'Interactive Learning Modules',
    description: 'Explore our comprehensive library of training modules organized by topic and duration. From quick 5-minute micro-modules to comprehensive courses.',
    icon: <BookOpen className="h-6 w-6 text-purple-600" />,
    screenshot: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjhmOWZhIi8+CjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjM2MCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzhjNWNmNiIgcng9IjgiLz4KPHR5eHQgeD0iMjAwIiB5PSI0NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkxlYXJuaW5nIE1vZHVsZXM8L3RleHQ+CjxyZWN0IHg9IjIwIiB5PSI4MCIgd2lkdGg9IjE3MCIgaGVpZ2h0PSIxMDAiIGZpbGw9IndoaXRlIiByeD0iOCIgc3Ryb2tlPSIjZTVlN2ViIi8+Cjx0ZXh0IHg9IjMwIiB5PSIxMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMxZjJkM2QiPkNsYXNzcm9vbSBNYW5hZ2VtZW50PC90ZXh0Pgo8dGV4dCB4PSIzMCIgeT0iMTIwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2YjcyODYiPjE1IG1pbnV0ZXMgfCAyMCBwb2ludHM8L3RleHQ+CjxyZWN0IHg9IjIxMCIgeT0iODAiIHdpZHRoPSIxNzAiIGhlaWdodD0iMTAwIiBmaWxsPSJ3aGl0ZSIgcng9IjgiIHN0cm9rZT0iI2U1ZTdlYiIvPgo8dGV4dCB4PSIyMjAiIHk9IjEwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzFmMmQzZCI+U29jaWFsLUVtb3Rpb25hbCBMZWFybmluZzwvdGV4dD4KPHR5eHQgeD0iMjIwIiB5PSIxMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzZiNzI4NiI+MjUgbWludXRlcyB8IDI1IHBvaW50czwvdGV4dD4KPHJlY3QgeD0iMjAiIHk9IjIwMCIgd2lkdGg9IjE3MCIgaGVpZ2h0PSI4MCIgZmlsbD0id2hpdGUiIHJ4PSI4IiBzdHJva2U9IiNlNWU3ZWIiLz4KPHR5eHQgeD0iMzAiIHk9IjIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzFmMmQzZCI+UmVhZGluZyBSZWFkaW5lc3M8L3RleHQ+Cjx0ZXh0IHg9IjMwIiB5PSIyNDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzZiNzI4NiI+MzAgbWludXRlcyB8IDMwIHBvaW50czwvdGV4dD4KPHJlY3QgeD0iMjEwIiB5PSIyMDAiIHdpZHRoPSIxNzAiIGhlaWdodD0iODAiIGZpbGw9IndoaXRlIiByeD0iOCIgc3Ryb2tlPSIjZTVlN2ViIi8+Cjx0ZXh0IHg9IjIyMCIgeT0iMjI1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMWYyZDNkIj5QYXJlbnQgQ29tbXVuaWNhdGlvbjwvdGV4dD4KPHR5eHQgeD0iMjIwIiB5PSIyNDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzZiNzI4NiI+MjAgbWludXRlcyB8IDE1IHBvaW50czwvdGV4dD4KPC9zdmc+',
    action: {
      text: 'Browse Modules',
      href: '/modules'
    },
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'assessment',
    title: 'Adaptive Assessments',
    description: 'Take skill assessments that adapt to your knowledge level and provide personalized learning recommendations based on your performance.',
    icon: <Target className="h-6 w-6 text-orange-600" />,
    screenshot: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjhmOWZhIi8+CjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjM2MCIgaGVpZ2h0PSI0MCIgZmlsbD0iI2Y5NzMxNiIgcng9IjgiLz4KPHR5eHQgeD0iMjAwIiB5PSI0NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFkYXB0aXZlIEFzc2Vzc21lbnQ8L3RleHQ+CjxyZWN0IHg9IjIwIiB5PSI4MCIgd2lkdGg9IjM2MCIgaGVpZ2h0PSIxNDAiIGZpbGw9IndoaXRlIiByeD0iOCIgc3Ryb2tlPSIjZTVlN2ViIi8+Cjx0ZXh0IHg9IjMwIiB5PSIxMTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMxZjJkM2QiPlF1ZXN0aW9uIDM6IFdoaXRjaCBzdHJhdGVneSBpcyBiZXN0IGZvciBtYW5hZ2luZy4uLjwvdGV4dD4KPHJlY3QgeD0iMzAiIHk9IjEzMCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZjVmZiIgcng9IjQiIHN0cm9rZT0iI2U1ZTdlYiIvPgo8dGV4dCB4PSI0MCIgeT0iMTQ1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2YjcyODYiPkEpIElnbm9yZSB0aGUgYmVoYXZpb3I8L3RleHQ+CjxyZWN0IHg9IjMwIiB5PSIxNjAiIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAiIGZpbGw9IiNmOWY1ZmYiIHJ4PSI0IiBzdHJva2U9IiNlNWU3ZWIiLz4KPHR5eHQgeD0iNDAiIHk9IjE3NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNmI3Mjg2Ij5CKSBVc2UgcmVkaXJlY3Rpb24gdGVjaG5pcXVlczwvdGV4dD4KPHJlY3QgeD0iMzAiIHk9IjE5MCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzEwYjk4MSIgcng9IjQiLz4KPHR5eHQgeD0iNDAiIHk9IjIwNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiPkMpIE9mZmVyIGNob2ljZXMgYW5kIGVuZ2FnZW1lbnQ8L3RleHQ+CjxyZWN0IHg9IjI5MCIgeT0iMjQwIiB3aWR0aD0iODAiIGhlaWdodD0iMzAiIGZpbGw9IiNmOTczMTYiIHJ4PSI2Ii8+Cjx0ZXh0IHg9IjMzMCIgeT0iMjYwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TmV4dDwvdGV4dD4KPC9zdmc+',
    action: {
      text: 'Start Assessment',
      href: '/assessment'
    },
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'ece-tracking',
    title: 'ECE Hours Tracking',
    description: 'Automatically track your professional development hours for ECE compliance. View your progress toward certification requirements.',
    icon: <Clock className="h-6 w-6 text-emerald-600" />,
    screenshot: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjhmOWZhIi8+CjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjM2MCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzEwYjk4MSIgcng9IjgiLz4KPHR5eHQgeD0iMjAwIiB5PSI0NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVDRSBIb3VycyBUcmFja2luZzwvdGV4dD4KPHJlY3QgeD0iMjAiIHk9IjgwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ3aGl0ZSIgcng9IjgiIHN0cm9rZT0iI2U1ZTdlYiIvPgo8dGV4dCB4PSIzMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMWYyZDNkIj5Zb3VyIFByb2dyZXNzPC90ZXh0Pgo8cGF0aCBkPSJNMzAgMTEwSDE4MFY3MEgzMEwzMCAxMTAiIGZpbGw9IiMxMGI5ODEiLz4KPHN2ZyB4PSIxODUiIHk9IjEwNSIgd2lkdGg9IjE5NSIgaGVpZ2h0PSIyMCI+CiAgPHJlY3Qgd2lkdGg9IjE5NSIgaGVpZ2h0PSIyMCIgZmlsbD0iI2ZiZjNmNCIgcng9IjQiLz4KICA8cmVjdCB3aWR0aD0iMTMwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMTBiOTgxIiByeD0iNCIvPgo8L3N2Zz4KPHR5eHQgeD0iMzAiIHk9IjEzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNmI3Mjg2Ij4yMCAvIDMwIGhvdXJzIGNvbXBsZXRlZDwvdGV4dD4KPHJlY3QgeD0iMjAiIHk9IjE2MCIgd2lkdGg9IjE3MCIgaGVpZ2h0PSIxMDAiIGZpbGw9IndoaXRlIiByeD0iOCIgc3Ryb2tlPSIjZTVlN2ViIi8+Cjx0ZXh0IHg9IjMwIiB5PSIxODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMxZjJkM2QiPkNhdGVnb3J5IEJyZWFrZG93bjwvdGV4dD4KPHR5eHQgeD0iMzAiIHk9IjIwNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNmI3Mjg2Ij7igKIgU29jaWFsLUVtb3Rpb25hbDogOGg8L3RleHQ+Cjx0ZXh0IHg9IjMwIiB5PSIyMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzZiNzI4NiI+4oCiIENvZ25pdGl2ZSBEZXY6IDZoPC90ZXh0Pgo8dGV4dCB4PSIzMCIgeT0iMjM1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2YjcyODYiPuKAoiBIZWFsdGggJiBTYWZldHk6IDRoPC90ZXh0Pgo8cmVjdCB4PSIyMTAiIHk9IjE2MCIgd2lkdGg9IjE3MCIgaGVpZ2h0PSIxMDAiIGZpbGw9IndoaXRlIiByeD0iOCIgc3Ryb2tlPSIjZTVlN2ViIi8+Cjx0ZXh0IHg9IjIyMCIgeT0iMTgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMWYyZDNkIj5DZXJ0aWZpY2F0aW9uIExldmVsPC90ZXh0Pgo8dGV4dCB4PSIyMjAiIHk9IjIwNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzEwYjk4MSI+QXNzaXN0YW50IFRlYWNoZXI8L3RleHQ+Cjx0ZXh0IHg9IjIyMCIgeT0iMjIwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2YjcyODYiPjEwIGhvdXJzIHRvIEFzc29jaWF0ZTwvdGV4dD4KPC9zdmc+',
    action: {
      text: 'View ECE Progress',
      href: '/dashboard'
    },
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'points-system',
    title: 'Points & Achievements',
    description: 'Earn points for completing modules and assessments. Build learning streaks and unlock achievements as you progress in your professional development.',
    icon: <Award className="h-6 w-6 text-yellow-600" />,
    screenshot: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjhmOWZhIi8+CjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjM2MCIgaGVpZ2h0PSI0MCIgZmlsbD0iI2Y1OWUwYiIgcng9IjgiLz4KPHR5eHQgeD0iMjAwIiB5PSI0NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlBvaW50cyAmIEFjaGlldmVtZW50czwvdGV4dD4KPHJlY3QgeD0iMjAiIHk9IjgwIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjgwIiBmaWxsPSJ3aGl0ZSIgcng9IjgiIHN0cm9rZT0iI2U1ZTdlYiIvPgo8cG9seWdvbiBwb2ludHM9Ijc1LDk1IDgyLDExMCA2OCwxMTAiIGZpbGw9IiNmNTllMGIiLz4KPHR5eHQgeD0iNzUiIHk9IjEyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzFmMmQzZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+MjQ1IFBvaW50czwvdGV4dD4KPHR5eHQgeD0iNzUiIHk9IjE0NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNmI3Mjg2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5MaWZldGltZTogNjc3PC90ZXh0Pgo8cmVjdCB4PSIxNDUiIHk9IjgwIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjgwIiBmaWxsPSJ3aGl0ZSIgcng9IjgiIHN0cm9rZT0iI2U1ZTdlYiIvPgo8Y2lyY2xlIGN4PSIyMDAiIGN5PSIxMTAiIHI9IjE1IiBmaWxsPSIjZjU5ZTBiIiBzdHJva2U9IiNmOTczMTYiIHN0cm9rZS13aWR0aD0iMyIvPgo8dGV4dCB4PSIyMDAiIHk9IjExNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPjU8L3RleHQ+Cjx0ZXh0IHg9IjIwMCIgeT0iMTQ1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMWYyZDNkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5EYXkgU3RyZWFrPC90ZXh0Pgo8cmVjdCB4PSIyNzAiIHk9IjgwIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjgwIiBmaWxsPSJ3aGl0ZSIgcng9IjgiIHN0cm9rZT0iI2U1ZTdlYiIvPgo8cG9seWdvbiBwb2ludHM9IjMyNSw5NSAzMzUsMTA1IDMzMCwxMTUgMzIwLDExNSAzMTUsMTA1IiBmaWxsPSIjZjU5ZTBiIi8+Cjx0ZXh0IHg9IjMyNSIgeT0iMTM1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMWYyZDNkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TaWx2ZXIgU3RhcjwvdGV4dD4KPHR5eHQgeD0iMzI1IiB5PSIxNDgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzZiNzI4NiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QWNoaWV2ZWQ8L3RleHQ+CjxyZWN0IHg9IjIwIiB5PSIxODAiIHdpZHRoPSIzNjAiIGhlaWdodD0iMTAwIiBmaWxsPSJ3aGl0ZSIgcng9IjgiIHN0cm9rZT0iI2U1ZTdlYiIvPgo8dGV4dCB4PSIzMCIgeT0iMjA1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMWYyZDNkIj5SZWNlbnQgQWNoaWV2ZW1lbnRzPC90ZXh0Pgo8Y2lyY2xlIGN4PSI1MCIgY3k9IjIzMCIgcj0iNSIgZmlsbD0iI2Y1OWUwYiIvPgo8dGV4dCB4PSI3MCIgeT0iMjM1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2YjcyODYiPkNvbXBsZXRlZCBGaXJzdCBNb2R1bGUgKCsyMCBwb2ludHMpPC90ZXh0Pgo8Y2lyY2xlIGN4PSI1MCIgY3k9IjI1MCIgcj0iNSIgZmlsbD0iI2Y1OWUwYiIvPgo8dGV4dCB4PSI3MCIgeT0iMjU1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2YjcyODYiPkZpcnN0IERheSBTdHJlYWsgKCs1IHBvaW50cyk8L3RleHQ+Cjwvc3ZnPg==',
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'video-library',
    title: 'Professional Video Library',
    description: 'Access curated professional development videos with integrated quizzes and ECE hour tracking for comprehensive learning experiences.',
    icon: <Play className="h-6 w-6 text-red-600" />,
    screenshot: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjhmOWZhIi8+CjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjM2MCIgaGVpZ2h0PSI0MCIgZmlsbD0iI2RjMjYyNiIgcng9IjgiLz4KPHR5eHQgeD0iMjAwIiB5PSI0NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlZpZGVvIExpYnJhcnk8L3RleHQ+CjxyZWN0IHg9IjIwIiB5PSI4MCIgd2lkdGg9IjE3MCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxZjJkM2QiIHJ4PSI4Ii8+Cjxwb2x5Z29uIHBvaW50cz0iODUsOTUgODUsMTYwIDEzNSwxMjcuNSIgZmlsbD0id2hpdGUiLz4KPHR5eHQgeD0iMTIwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMxZjJkM2QiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkNsYXNzcm9vbSBNYW5hZ2VtZW50PC90ZXh0Pgo8dGV4dCB4PSIxMjAiIHk9IjIxNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNmI3Mjg2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj4xMiBtaW51dGVzIHwgMS41IEVDRSBob3VyczwvdGV4dD4KPHJlY3QgeD0iMjEwIiB5PSI4MCIgd2lkdGg9IjE3MCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxZjJkM2QiIHJ4PSI4Ii8+Cjxwb2x5Z29uIHBvaW50cz0iMjc1LDk1IDI3NSwxNjAgMzI1LDEyNy41IiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSIzMTAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzFmMmQzZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U29jaWFsLUVtb3Rpb25hbCBEZXY8L3RleHQ+Cjx0ZXh0IHg9IjMxMCIgeT0iMjE1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2YjcyODYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPjE4IG1pbnV0ZXMgfCAyIEVDRSBob3VyczwvdGV4dD4KPHJlY3QgeD0iMjAiIHk9IjI0MCIgd2lkdGg9IjE3MCIgaGVpZ2h0PSI0MCIgZmlsbD0id2hpdGUiIHJ4PSI4IiBzdHJva2U9IiNlNWU3ZWIiLz4KPHR5eHQgeD0iMzAiIHk9IjI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzFmMmQzZCI+UGFyZW50IENvbW11bmljYXRpb248L3RleHQ+Cjx0ZXh0IHg9IjMwIiB5PSIyNzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzZiNzI4NiI+MTAgbWludXRlcyB8IDEgRUNFIGhvdXI8L3RleHQ+CjxyZWN0IHg9IjIxMCIgeT0iMjQwIiB3aWR0aD0iMTcwIiBoZWlnaHQ9IjQwIiBmaWxsPSJ3aGl0ZSIgcng9IjgiIHN0cm9rZT0iI2U1ZTdlYiIvPgo8dGV4dCB4PSIyMjAiIHk9IjI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzFmMmQzZCI+QmVoYXZpb3IgTWFuYWdlbWVudDwvdGV4dD4KPHR5eHQgeD0iMjIwIiB5PSIyNzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzZiNzI4NiI+MTUgbWludXRlcyB8IDEuNSBFQ0UgaG91cnM8L3RleHQ+Cjwvc3ZnPg==',
    action: {
      text: 'Browse Videos',
      href: '/videos'
    },
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'director-toolkit',
    title: 'Director Toolkit',
    description: 'Access powerful administrative tools including teacher management, ECE tracking, Perfect Manager coaching system, and comprehensive reporting.',
    icon: <Settings className="h-6 w-6 text-indigo-600" />,
    action: {
      text: 'Open Director Toolkit',
      href: '/admin'
    },
    userTypes: ['admin', 'school_admin']
  },
  {
    id: 'teacher-management',
    title: 'Teacher Profiles & Progress',
    description: 'Monitor your team\'s professional development, track ECE hours, generate certificates, and manage user roles and permissions.',
    icon: <Users className="h-6 w-6 text-cyan-600" />,
    action: {
      text: 'Manage Teachers',
      href: '/admin/teachers'
    },
    userTypes: ['admin', 'school_admin']
  },
  {
    id: 'perfect-manager',
    title: 'Perfect Manager AI Coach',
    description: 'Get personalized leadership coaching for challenging workplace situations. AI-powered advice from top leadership experts for ECE directors.',
    icon: <MessageSquare className="h-6 w-6 text-pink-600" />,
    action: {
      text: 'Try Perfect Manager',
      href: '/admin/perfect-manager'
    },
    userTypes: ['admin', 'school_admin']
  },
  {
    id: 'module-creator',
    title: 'Create Custom Modules',
    description: 'Build your own training modules using AI assistance, manual creation, or PowerPoint import. Share with your team or the community.',
    icon: <Zap className="h-6 w-6 text-violet-600" />,
    action: {
      text: 'Create Module',
      href: '/new-module-creator'
    },
    userTypes: ['teacher', 'admin', 'school_admin']
  },
  {
    id: 'getting-started',
    title: 'Ready to Begin!',
    description: 'You\'re all set to start your professional development journey. Remember to check your dashboard regularly for new recommendations and progress updates.',
    icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
    userTypes: ['teacher', 'admin', 'school_admin']
  }
];

export default function UserTutorial({ isOpen, onClose, userRole }: UserTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter steps based on user role
  const relevantSteps = tutorialSteps.filter(step => step.userTypes.includes(userRole));
  const totalSteps = relevantSteps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Mark tutorial as completed
  const completeTutorialMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/user/complete-tutorial', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Tutorial Completed!",
        description: "Welcome to MentorMe ECE. Start exploring and building your professional development journey.",
      });
    }
  });

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    completeTutorialMutation.mutate();
    onClose();
  };

  const handleSkip = () => {
    completeTutorialMutation.mutate();
    onClose();
  };

  const currentStepData = relevantSteps[currentStep];

  if (!currentStepData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              {currentStepData.icon}
              {currentStepData.title}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              <X className="h-4 w-4" />
              Skip Tutorial
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="py-6">
          <Card className="border-2 border-dashed border-gray-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center">
                  {currentStepData.icon}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{currentStepData.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {currentStepData.description}
                  </p>
                </div>

                {currentStepData.action && (
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (currentStepData.action?.href) {
                          window.open(currentStepData.action.href, '_blank');
                        }
                        if (currentStepData.action?.onClick) {
                          currentStepData.action.onClick();
                        }
                      }}
                      className="gap-2"
                    >
                      {currentStepData.action.text}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Role-specific tips */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                {userRole === 'teacher' ? 'Teacher Tip' : 
                 userRole === 'admin' ? 'Administrator Tip' : 
                 'School Admin Tip'}
              </span>
            </div>
            <p className="text-sm text-blue-800">
              {currentStepData.id === 'welcome' && userRole === 'teacher' && 
                "Focus on building your learning streak and tracking ECE hours for professional development requirements."}
              {currentStepData.id === 'welcome' && (userRole === 'admin' || userRole === 'school_admin') && 
                "Use the Director Toolkit to manage your team's professional development and track school-wide progress."}
              {currentStepData.id === 'modules' && 
                "Start with micro modules (5 minutes) for quick learning during busy days, then progress to longer modules."}
              {currentStepData.id === 'assessment' && 
                "Take the initial assessment to get personalized module recommendations based on your current knowledge."}
              {currentStepData.id === 'ece-tracking' && 
                "ECE hours are automatically tracked when you complete eligible modules - no manual entry needed!"}
              {currentStepData.id === 'director-toolkit' && 
                "The Perfect Manager feature provides AI coaching for challenging workplace situations with your team."}
              {currentStepData.id === 'getting-started' && 
                "Bookmark the dashboard and check it regularly for new module recommendations and progress updates."}
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip}>
              Skip Tutorial
            </Button>
            <Button onClick={handleNext} className="gap-2">
              {currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
              {currentStep === totalSteps - 1 ? 
                <CheckCircle2 className="h-4 w-4" /> : 
                <ArrowRight className="h-4 w-4" />
              }
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}