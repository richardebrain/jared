import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CoinsIcon, ShoppingBag, Gift, Calendar, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface BearBucksRewardsProps {
  bearBucks?: number;
  points?: number;
  className?: string;
}

const BearBucksRewards: React.FC<BearBucksRewardsProps> = ({
  bearBucks = 0,
  points = 0,
  className = "",
}) => {
  // Define the conversion rate: 25 points = 1 Bear Buck
  const conversionRate = 25;
  
  // Initialize state for conversion in progress
  const [isConverting, setIsConverting] = useState(false);
  const [showConversionSuccess, setShowConversionSuccess] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Calculate potential Bear Bucks that could be earned
  const potentialBearBucks = Math.floor(points / conversionRate);
  
  // Function to convert points to Bear Bucks
  const convertPointsToBearBucks = async () => {
    if (points < conversionRate) return;
    
    setIsConverting(true);
    try {
      // Convert the maximum number of points possible (in multiples of conversionRate)
      const pointsToConvert = Math.floor(points / conversionRate) * conversionRate;
      const bearBucksToAdd = Math.floor(points / conversionRate);
      
      const response = await apiRequest("/api/convert-points", {
        method: "POST",
        data: {
          pointsToConvert,
          bearBucksToAdd
        }
      });
      
      // Show success message
      setShowConversionSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowConversionSuccess(false);
      }, 5000);
      
      // Invalidate user data query to refresh
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "Points Converted Successfully",
        description: `Converted ${pointsToConvert} points to ${bearBucksToAdd} Bear Bucks!`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error converting points:", error);
      toast({
        title: "Conversion Failed",
        description: "There was an error converting your points. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };
  
  // Define the redemption options
  const redemptionOptions = [
    {
      bucksRequired: 10,
      reward: "Leave 15 minutes early",
      category: "time",
      description: "Redeem to leave work 15 minutes early (with director approval)"
    },
    {
      bucksRequired: 15,
      reward: "30-minute lunch break extension",
      category: "time",
      description: "Extend your lunch break by an additional 30 minutes"
    },
    {
      bucksRequired: 20,
      reward: "Dress down day",
      category: "special",
      description: "Wear casual attire for a day instead of the standard uniform"
    },
    {
      bucksRequired: 25,
      reward: "Raising Arizona swag item",
      category: "item",
      description: "Choose from available Raising Arizona merchandise"
    },
    {
      bucksRequired: 30,
      reward: "Leave 30 minutes early",
      category: "time",
      description: "Redeem to leave work 30 minutes early (with director approval)"
    },
    {
      bucksRequired: 40,
      reward: "Half day off (paid)",
      category: "time",
      description: "Take a half day off with pay (schedule with director)"
    },
    {
      bucksRequired: 50,
      reward: "Full day off (paid)",
      category: "time",
      description: "Enjoy a full day off with pay (schedule with director)"
    },
    {
      bucksRequired: 75,
      reward: "Gift card ($25 value)",
      category: "item",
      description: "$25 gift card to a popular retailer or restaurant"
    },
    {
      bucksRequired: 100,
      reward: "Gift card ($50 value)",
      category: "item",
      description: "$50 gift card to a popular retailer or restaurant"
    }
  ];

  // Filter options by category
  const timeOffOptions = redemptionOptions.filter(option => option.category === "time");
  const itemOptions = redemptionOptions.filter(option => option.category === "item" || option.category === "special");
  
  return (
    <Card className={className}>
      <CardHeader className="bg-gradient-to-r from-amber-100 to-amber-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-amber-800">Bear Bucks Rewards</CardTitle>
            <CardDescription>
              Convert your points into Bear Bucks to redeem for rewards
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-amber-200 px-4 py-2 rounded-lg">
            <CoinsIcon className="h-5 w-5 text-amber-700" />
            <span className="font-bold text-lg text-amber-800">{bearBucks}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-2">Points to Bear Bucks Conversion</h3>
          <div className="flex items-center justify-center gap-4 p-3">
            <div className="text-center p-3 bg-white rounded-lg shadow border border-blue-100">
              <span className="block text-xl font-bold text-gray-700">25 Points</span>
              <span className="text-gray-500 text-sm">converts to</span>
            </div>
            <div className="text-2xl text-blue-500">→</div>
            <div className="text-center p-3 bg-white rounded-lg shadow border border-amber-200">
              <span className="block text-xl font-bold text-amber-700">1 Bear Buck</span>
              <span className="text-gray-500 text-sm">for rewards</span>
            </div>
          </div>
          
          <div className="mt-6 bg-white p-4 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">How to Earn Points</h4>
            <ul className="text-sm text-gray-700 space-y-2 pl-5 list-disc">
              <li><span className="font-medium">Complete learning modules</span> (10-20 points based on difficulty)</li>
              <li><span className="font-medium">Watch training videos</span> (5 points for videos under 10 min, 8 points for longer videos)</li>
              <li><span className="font-medium">Play educational games</span> (5-10 points per game)</li>
              <li><span className="font-medium">Receive Core Values Shout-Outs</span> (5 points per shout-out)</li>
              <li><span className="font-medium">Pass assessments</span> (up to 50 points based on difficulty & score)</li>
            </ul>
            <p className="text-xs text-gray-500 mt-2">Note: Limited to 2 videos and 2 games per day for points.</p>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-blue-700">
              You currently have <span className="font-bold">{points} points</span>, 
              which could convert to <span className="font-bold">{potentialBearBucks} Bear Bucks</span>
            </p>
            
            {showConversionSuccess && (
              <Alert className="my-2 bg-green-50 border-green-200">
                <AlertCircle className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-700">Conversion Successful!</AlertTitle>
                <AlertDescription className="text-green-600 text-sm">
                  You converted points to Bear Bucks. Your balances have been updated.
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              variant="outline" 
              className="mt-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              disabled={points < conversionRate || isConverting}
              onClick={convertPointsToBearBucks}
            >
              {isConverting ? "Converting..." : "Convert Points to Bear Bucks"}
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all" className="flex-1">All Rewards</TabsTrigger>
            <TabsTrigger value="time" className="flex-1">Time Off</TabsTrigger>
            <TabsTrigger value="items" className="flex-1">Items & Special</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bear Bucks</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptionOptions.map((option, idx) => (
                  <TableRow key={idx} className={bearBucks >= option.bucksRequired ? "" : "opacity-60"}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        <CoinsIcon className="h-4 w-4 text-amber-500" />
                        {option.bucksRequired}
                      </div>
                    </TableCell>
                    <TableCell>{option.reward}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-600">{option.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="time">
            <div className="grid gap-4">
              {timeOffOptions.map((option, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-lg border ${
                    bearBucks >= option.bucksRequired 
                      ? "bg-white border-green-100" 
                      : "bg-gray-50 border-gray-200 opacity-60"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">{option.reward}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded">
                      <CoinsIcon className="h-4 w-4 text-amber-500" />
                      <span className="font-bold">{option.bucksRequired}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{option.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="items">
            <div className="grid gap-4">
              {itemOptions.map((option, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-lg border ${
                    bearBucks >= option.bucksRequired 
                      ? "bg-white border-purple-100" 
                      : "bg-gray-50 border-gray-200 opacity-60"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {option.category === "item" ? (
                        <Gift className="h-5 w-5 text-purple-500" />
                      ) : (
                        <ShoppingBag className="h-5 w-5 text-indigo-500" />
                      )}
                      <span className="font-medium">{option.reward}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded">
                      <CoinsIcon className="h-4 w-4 text-amber-500" />
                      <span className="font-bold">{option.bucksRequired}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{option.description}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="bg-gray-50 border-t p-4">
        <p className="text-sm text-gray-600">
          Speak to your director to redeem Bear Bucks for rewards. 
          Availability of rewards may vary by location.
        </p>
      </CardFooter>
    </Card>
  );
};

export default BearBucksRewards;