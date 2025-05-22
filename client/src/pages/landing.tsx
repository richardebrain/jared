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
                <div className="w-[350px] h-[350px] sm:w-[400px] sm:h-[400px] bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-full flex items-center justify-center">
                  <img
                    src="https://i.imgur.com/ExTyH0O.png"
                    alt="MentorMe Dashboard"
                    className="w-[90%] h-auto rounded-xl shadow-lg transform -rotate-3 hover:rotate-0 transition-transform"
                  />
                </div>
                <div className="absolute top-10 right-5 bg-white p-3 rounded-lg shadow-lg">
                  <div className="flex items-center gap-2">
                    <Award className="h-8 w-8 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Level Up!</p>
                      <p className="text-xs text-muted-foreground">Master Lead Teacher</p>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-10 -left-5 bg-white p-3 rounded-lg shadow-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <p className="text-sm font-medium">+15 Bear Bucks</p>
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