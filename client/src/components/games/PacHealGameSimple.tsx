import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Gamepad2 } from 'lucide-react';

export default function PacHealGame() {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          Pac-Heal: Emotional Regulation Adventure
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-lg">
            <Gamepad2 className="h-16 w-16 mx-auto text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold text-blue-700 mb-4">Educational Game Coming Soon</h3>
            <p className="text-gray-600 mb-6">
              We're preparing an engaging Pac-Man style game that teaches emotional regulation and classroom management skills for early childhood educators.
            </p>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
              <h4 className="font-semibold text-blue-700 mb-2">What You'll Learn:</h4>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li>• Transform negative emotions into positive affirmations</li>
                <li>• Practice identifying children's emotional states</li>
                <li>• Learn therapeutic responses to difficult behaviors</li>
                <li>• Master daily routine transitions</li>
              </ul>
            </div>
            <Button className="mt-6 bg-blue-500 hover:bg-blue-600" disabled>
              Game Loading...
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}