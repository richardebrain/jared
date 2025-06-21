import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Clock, Users, Activity, CheckCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SessionStats {
  totalActiveSessions: number;
  usersWithMultipleSessions: number;
  oldestSession: string | null;
  sessionDuration: string;
  idleTimeout: string;
  maxConcurrentSessions: number;
  securityLevel: string;
}

interface MySessionInfo {
  currentSessionId: string;
  activeSessions: number;
  maxAllowed: number;
  sessionExpiry: string;
  lastActivity: string;
}

export default function SessionSecurityDashboard() {
  const { data: sessionStats, isLoading: statsLoading } = useQuery<SessionStats>({
    queryKey: ["/api/admin/session-stats"],
  });

  const { data: mySession, isLoading: sessionLoading } = useQuery<MySessionInfo>({
    queryKey: ["/api/auth/my-sessions"],
  });

  if (statsLoading || sessionLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getSecurityStatus = () => {
    if (!mySession) return { status: "Unknown", color: "gray" };
    
    const sessionRatio = mySession.activeSessions / mySession.maxAllowed;
    if (sessionRatio < 0.7) return { status: "Excellent", color: "green" };
    if (sessionRatio < 1.0) return { status: "Good", color: "yellow" };
    return { status: "At Limit", color: "orange" };
  };

  const securityStatus = getSecurityStatus();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Enhanced Session Security Dashboard
        </h1>
        <p className="text-gray-600">
          Real-time monitoring of platform security and session management for ECE professionals
        </p>
      </div>

      {/* Security Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Security Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {sessionStats?.securityLevel?.split(' ').slice(-1)[0] || "Enhanced"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enterprise-grade protection active
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {sessionStats?.totalActiveSessions || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Platform-wide sessions
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Session Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {sessionStats?.sessionDuration || "24h"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Auto-expire after 24 hours
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Idle Timeout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {sessionStats?.idleTimeout || "3h"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Auto-logout when inactive
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Session Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Your Session Security
            </CardTitle>
            <CardDescription>
              Current session status and security information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Security Status</span>
              <Badge 
                variant={securityStatus.color === "green" ? "default" : "secondary"}
                className={`${
                  securityStatus.color === "green" ? "bg-green-100 text-green-800" :
                  securityStatus.color === "yellow" ? "bg-yellow-100 text-yellow-800" :
                  "bg-orange-100 text-orange-800"
                }`}
              >
                {securityStatus.status}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Session ID</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {mySession?.currentSessionId}
                </code>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Sessions</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {mySession?.activeSessions} / {mySession?.maxAllowed}
                  </span>
                  {mySession?.activeSessions === mySession?.maxAllowed ? (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Activity</span>
                <span className="text-sm font-medium">
                  {mySession?.lastActivity ? 
                    formatDistanceToNow(new Date(mySession.lastActivity), { addSuffix: true }) :
                    "Just now"
                  }
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Session Expires</span>
                <span className="text-sm font-medium">
                  {mySession?.sessionExpiry ? 
                    formatDistanceToNow(new Date(mySession.sessionExpiry), { addSuffix: true }) :
                    "24 hours"
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Security Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-600" />
              Platform Security Metrics
            </CardTitle>
            <CardDescription>
              Real-time security monitoring across the ECE platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {sessionStats?.totalActiveSessions || 0}
                </div>
                <div className="text-xs text-blue-600 mt-1">Total Sessions</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {sessionStats?.maxConcurrentSessions || 3}
                </div>
                <div className="text-xs text-green-600 mt-1">Max Per User</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Users with Multiple Sessions</span>
                <span className="font-medium">{sessionStats?.usersWithMultipleSessions || 0}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Oldest Active Session</span>
                <span className="text-sm font-medium">
                  {sessionStats?.oldestSession ? 
                    formatDistanceToNow(new Date(sessionStats.oldestSession), { addSuffix: true }) :
                    "No data"
                  }
                </span>
              </div>
            </div>

            <Separator />

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center text-green-800">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Security Features Active</span>
              </div>
              <ul className="text-xs text-green-700 mt-2 space-y-1">
                <li>• Concurrent session limits (max 3)</li>
                <li>• 3-hour idle timeout protection</li>
                <li>• 24-hour rolling session expiry</li>
                <li>• Real-time activity monitoring</li>
                <li>• Automatic cleanup of old sessions</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Information Footer */}
      <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <Shield className="h-8 w-8 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Enhanced Security for ECE Professionals</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                Your professional development platform is protected with enterprise-grade security measures. 
                Sessions are automatically managed to ensure data protection while maintaining convenient access 
                for early childhood educators. Multiple device access is supported up to 3 concurrent sessions 
                per user account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}