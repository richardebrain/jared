import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

export default function EmergencyLogin() {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmergencyLogin = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Direct API call bypassing auth context
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        data: credentials,
        timeout: 5000
      });
      
      if (response) {
        console.log("Emergency login successful");
        // Store auth success flag
        sessionStorage.setItem('emergencyAuthSuccess', 'true');
        // Force immediate redirect
        window.location.replace("/dashboard");
      }
    } catch (err: any) {
      console.error("Emergency login failed:", err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">
            Emergency Login
          </CardTitle>
          <p className="text-gray-600">Direct authentication bypass</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            placeholder="Username"
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
          />
          <Input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          />
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          <Button 
            onClick={handleEmergencyLogin}
            disabled={loading || !credentials.username || !credentials.password}
            className="w-full"
          >
            {loading ? "Authenticating..." : "Emergency Login"}
          </Button>
          <div className="text-center space-y-2">
            <Button 
              variant="outline"
              onClick={() => window.location.href = "/dashboard"}
              className="w-full"
            >
              Direct Dashboard Access
            </Button>
            <Button 
              variant="ghost"
              onClick={() => window.location.href = "/login"}
              className="w-full"
            >
              Back to Normal Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}