import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Coins, Gift, Star, Award, TrendingUp, Users, History } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  bearBucks: number;
  profilePicture?: string;
  jobTitle?: string;
  level: number;
}

interface BearBucksTransaction {
  id: number;
  recipientId: number;
  senderId: number;
  amount: number;
  reason: string;
  category: string;
  createdAt: string;
  recipient: {
    firstName: string;
    lastName: string;
  };
  sender: {
    firstName: string;
    lastName: string;
  };
}

export default function AdminBearBucksPage() {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [amount, setAmount] = useState<number>(10);
  const [reason, setReason] = useState<string>("");
  const [category, setCategory] = useState<string>("recognition");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teachers = [], isLoading: loadingTeachers } = useQuery<Teacher[]>({
    queryKey: ['/api/users'],
  });

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery<BearBucksTransaction[]>({
    queryKey: ['/api/admin/bear-bucks/transactions'],
  });

  const awardBearBucksMutation = useMutation({
    mutationFn: (data: {
      recipientId: number;
      amount: number;
      reason: string;
      category: string;
    }) => apiRequest('POST', '/api/admin/bear-bucks/award', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bear-bucks/transactions'] });
      setIsDialogOpen(false);
      setSelectedTeacher(null);
      setAmount(10);
      setReason("");
      setCategory("recognition");
      toast({
        title: "Bear Bucks Awarded!",
        description: `Successfully awarded ${amount} Bear Bucks to ${selectedTeacher?.firstName}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to award Bear Bucks. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAwardBearBucks = () => {
    if (!selectedTeacher || amount <= 0 || !reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a teacher, enter an amount, and provide a reason.",
        variant: "destructive",
      });
      return;
    }

    awardBearBucksMutation.mutate({
      recipientId: selectedTeacher.id,
      amount,
      reason: reason.trim(),
      category,
    });
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'recognition': return 'bg-green-100 text-green-800';
      case 'achievement': return 'bg-blue-100 text-blue-800';
      case 'bonus': return 'bg-purple-100 text-purple-800';
      case 'milestone': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'recognition': return 'Recognition';
      case 'achievement': return 'Achievement';
      case 'bonus': return 'Bonus';
      case 'milestone': return 'Milestone';
      default: return 'Other';
    }
  };

  const getTeacherLevelColor = (level: number) => {
    if (level >= 10) return 'bg-purple-100 text-purple-800';
    if (level >= 7) return 'bg-blue-100 text-blue-800';
    if (level >= 4) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loadingTeachers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Bear Bucks system...</p>
        </div>
      </div>
    );
  }

  const totalBearBucks = teachers.reduce((sum, teacher) => sum + (teacher.bearBucks || 0), 0);
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Coins className="h-8 w-8 text-amber-600" />
            <h1 className="text-3xl font-bold text-gray-800">Bear Bucks Management</h1>
          </div>
          <p className="text-gray-600">Award Bear Bucks to recognize and motivate your team</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Coins className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Bear Bucks</p>
                  <p className="text-2xl font-bold text-gray-800">{totalBearBucks.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Teachers</p>
                  <p className="text-2xl font-bold text-gray-800">{teachers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-800">{transactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Balance</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {teachers.length > 0 ? Math.round(totalBearBucks / teachers.length) : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Teachers List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teachers ({teachers.length})
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    <Gift className="h-4 w-4 mr-2" />
                    Award Bear Bucks
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Award Bear Bucks</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Select Teacher</Label>
                      <Select onValueChange={(value) => {
                        const teacher = teachers.find(t => t.id === parseInt(value));
                        setSelectedTeacher(teacher || null);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a teacher..." />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                              {teacher.firstName} {teacher.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        value={amount}
                        onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                        placeholder="Enter amount..."
                      />
                    </div>

                    <div>
                      <Label>Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recognition">Recognition</SelectItem>
                          <SelectItem value="achievement">Achievement</SelectItem>
                          <SelectItem value="bonus">Bonus</SelectItem>
                          <SelectItem value="milestone">Milestone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Reason</Label>
                      <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Why are you awarding these Bear Bucks?"
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleAwardBearBucks}
                      disabled={awardBearBucksMutation.isPending}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      {awardBearBucksMutation.isPending ? "Awarding..." : "Award Bear Bucks"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={teacher.profilePicture || undefined} />
                        <AvatarFallback>
                          {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="font-medium">
                          {teacher.firstName} {teacher.lastName}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getTeacherLevelColor(teacher.level)}>
                            Level {teacher.level}
                          </Badge>
                          {teacher.jobTitle && (
                            <span className="text-xs text-gray-500">{teacher.jobTitle}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Coins className="h-4 w-4" />
                        {teacher.bearBucks || 0}
                      </div>
                      <div className="text-xs text-gray-500">Bear Bucks</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Awards
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-3"></div>
                  <p className="text-gray-500">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No awards yet</p>
                  <p className="text-sm text-gray-400">Start recognizing your team!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-4 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(transaction.category)}>
                            {getCategoryLabel(transaction.category)}
                          </Badge>
                          <div className="flex items-center gap-1 text-amber-600 font-semibold">
                            <Coins className="h-4 w-4" />
                            {transaction.amount}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(transaction.createdAt), 'MMM dd, HH:mm')}
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <div className="font-medium mb-1">
                          {transaction.recipient.firstName} {transaction.recipient.lastName}
                        </div>
                        <div className="text-gray-600">{transaction.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}