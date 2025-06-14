import React from 'react';
import { Link } from 'wouter';
import { 
  Shield, 
  GraduationCap, 
  TrendingUp, 
  Award, 
  Zap, 
  CheckCircle, 
  BarChart, 
  Users, 
  ChevronRight 
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero section */}
      <section className="bg-gradient-to-b from-indigo-50 to-white py-16 md:py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-indigo-100 px-3 py-1 text-sm text-indigo-800 mb-4">
                Early Childhood Education Professional Development
              </div>
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Transform Your Teachers with{" "}
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  MentorMe
                </span>
              </h1>
              <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                The AI-powered professional development platform designed specifically for early childhood educators. Personalized learning paths, gamified rewards, and comprehensive analytics.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button className="gap-1 px-6" asChild>
                  <Link href="/business-signup">
                    Get Started
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="gap-1 px-6" onClick={() => {
                  // Clear auth state and force direct navigation
                  localStorage.removeItem('isAuthenticated');
                  localStorage.removeItem('user');
                  // Force a complete hard refresh to break any loop
                  window.location.replace('/login');
                }}>
                  Sign In
                </Button>
              </div>
            </div>
            <div className="mx-auto lg:ml-auto flex justify-center items-center">
              <div className="relative">
                <div className="w-[380px] h-[380px] sm:w-[420px] sm:h-[420px] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center p-4">
                  {/* Interactive Dashboard Preview */}
                  <div className="w-full h-full bg-white rounded-xl shadow-2xl border border-gray-100 transform hover:scale-[1.02] transition-transform duration-300 p-5 overflow-hidden">
                    {/* Dashboard Header with Progression Style */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">MentorMe</span>
                          <div className="text-xs text-gray-500">Teacher Dashboard</div>
                        </div>
                      </div>
                      <div className="text-2xl">🌟</div>
                    </div>
                    
                    {/* Teacher Level Card */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg p-3 mb-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium opacity-90">Current Level</div>
                          <div className="text-lg font-bold">Lead Teacher</div>
                        </div>
                        <div className="text-3xl">🏆</div>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm opacity-90 mb-1">
                          <span>Progress to Master</span>
                          <span>850/1000 pts</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div className="bg-white h-2 rounded-full w-[85%]"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-700">12</div>
                        <div className="text-xs font-medium text-blue-600">Modules</div>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-emerald-700">850</div>
                        <div className="text-xs font-medium text-emerald-600">Points</div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-700">7</div>
                        <div className="text-xs font-medium text-purple-600">Day Streak</div>
                      </div>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-gray-700 mb-2">Recent Progress</div>
                      
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-green-900">Positive Behavior Support</div>
                            <div className="text-xs text-green-600">Complete ✨</div>
                          </div>
                          <div className="text-xs font-bold text-green-700">+20</div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <GraduationCap className="h-3 w-3 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-blue-900">Child Development</div>
                            <div className="w-full bg-blue-200 rounded-full h-1 mt-1">
                              <div className="bg-blue-600 h-1 rounded-full w-3/4"></div>
                            </div>
                          </div>
                          <div className="text-xs text-blue-600">75%</div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <Zap className="h-3 w-3 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-purple-900">Assessment Ready</div>
                            <div className="text-xs text-purple-600">Unlock next level</div>
                          </div>
                          <ChevronRight className="h-3 w-3 text-purple-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Achievement Notifications */}
                <div className="absolute top-8 right-4 bg-white p-3 rounded-xl shadow-lg border border-amber-200 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">🏆</div>
                    <div>
                      <p className="text-sm font-bold text-amber-700">Achievement!</p>
                      <p className="text-xs text-amber-600">7-Day Streak</p>
                    </div>
                  </div>
                </div>
                

                
                <div className="absolute top-16 -left-6 bg-white p-2 rounded-lg shadow-lg border border-blue-200">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-medium text-blue-700">Level Up Soon!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Everything You Need to Excel
            </h2>
            <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-[700px] mx-auto">
              MentorMe provides a complete ecosystem for professional growth in early childhood education
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Personalized Learning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tailored training paths based on individual assessments, learning styles, and classroom needs.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Gamified Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Engaging rewards system with Bear Bucks, achievements, and interactive bonus games.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Core Values Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Promote your school's culture with integrated core values training and peer recognition.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-blue-600" />
                  Owner's Toolkit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Comprehensive analytics, EOS metrics integration, and business intelligence tools.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Director Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Limited access view for directors to monitor teacher progress and key performance metrics.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Required Training
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Built-in core training modules including trauma-informed care and child development.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing section */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-[700px] mx-auto">
              Choose the plan that works for your school's needs and budget
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle>Basic</CardTitle>
                <div className="text-3xl font-bold">$59/month</div>
                <CardDescription>Plus $5 per teacher monthly</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>Complete learning platform</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>Teacher assessments</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>Core modules</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>Rewards ecosystem</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>Basic analytics</span>
                  </li>
                </ul>
                <Button className="w-full mt-4" asChild>
                  <Link href="/business-signup">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-primary">
              <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 bg-primary text-primary-foreground text-xs font-medium py-1 px-3 rounded-bl-lg">
                Popular
              </div>
              <CardHeader>
                <CardTitle>Owner's Toolkit</CardTitle>
                <div className="text-3xl font-bold">$78/month</div>
                <CardDescription>Plus $5 per teacher monthly</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>Everything in Basic</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>EOS tools integration</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>Business intelligence</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>Director dashboard</span>
                  </li>
                </ul>
                <Button className="w-full mt-4" asChild>
                  <Link href="/business-signup">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle>Premium Branding</CardTitle>
                <div className="text-3xl font-bold">$78/month</div>
                <CardDescription>$1,999 one-time setup fee</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>Everything in Owner's Toolkit</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>Custom branding & logo</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>Custom core values training</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>Custom company song</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    <span>Branded shout-outs</span>
                  </li>
                </ul>
                <Button className="w-full mt-4" asChild>
                  <Link href="/business-signup">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Transform Your School?
              </h2>
              <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-[600px] mx-auto">
                Join schools across the country that are elevating their teachers' professional development with MentorMe.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button className="gap-1 px-8" size="lg" asChild>
                <Link href="/business-signup">
                  Get Started
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="gap-1 px-8" size="lg" onClick={() => {
                // Clear any potential stale authentication data
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('user');
                // Force direct navigation to login page
                window.location.href = "/login";
              }}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-6 md:py-12">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">MentorMe</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © 2025 MentorMe. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-4">
              <a href="#" onClick={(e) => {
                e.preventDefault();
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('user');
                window.location.href = "/login";
              }} className="text-sm text-muted-foreground hover:text-foreground">Sign In</a>
              <Link href="/business-signup" className="text-sm text-muted-foreground hover:text-foreground">Business Sign-up</Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}