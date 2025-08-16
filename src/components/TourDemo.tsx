import React, { useState, useCallback } from 'react';
import { CustomTour } from '@/components/CustomTour';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Star, 
  Users, 
  TrendingUp, 
  Settings,
  HelpCircle,
  Zap,
  Target,
  Award,
  BarChart3
} from 'lucide-react';

interface TourStep {
  target: string;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TourState {
  run: boolean;
  steps: TourStep[];
}

const TourDemo: React.FC = () => {
  const [tourState, setTourState] = useState<TourState>({
    run: false,
    steps: [
      {
        target: '.tour-welcome',
        content: (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary">Welcome to our app! 🎉</h3>
            <p>Let me show you around our amazing dashboard and its powerful features.</p>
          </div>
        ),
        placement: 'center',
      },
      {
        target: '.tour-stats',
        content: (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary">Analytics Overview</h3>
            <p>Here you can see your key performance metrics at a glance. These cards update in real-time to give you the latest insights.</p>
          </div>
        ),
      },
      {
        target: '.tour-features',
        content: (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary">Feature Showcase</h3>
            <p>This section highlights our main features. Each feature card shows detailed information and quick actions you can take.</p>
          </div>
        ),
      },
      {
        target: '.tour-actions',
        content: (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary">Quick Actions</h3>
            <p>Use these buttons to perform common tasks quickly. They're designed for maximum efficiency and ease of use.</p>
          </div>
        ),
      },
      {
        target: '.tour-help',
        content: (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-primary">Need Help? 💡</h3>
            <p>Click here anytime you need assistance. Our help system is context-aware and will provide relevant guidance.</p>
          </div>
        ),
      },
    ],
  });

  const [contextualHelp, setContextualHelp] = useState<{
    show: boolean;
    stepIndex: number;
  }>({ show: false, stepIndex: -1 });

  const handleTourComplete = useCallback(() => {
    setTourState(prev => ({ ...prev, run: false }));
  }, []);

  const handleTourSkip = useCallback(() => {
    setTourState(prev => ({ ...prev, run: false }));
    setContextualHelp({ show: false, stepIndex: -1 });
  }, []);

  const startTour = () => {
    setTourState(prev => ({ ...prev, run: true }));
  };

  const resetTour = () => {
    setTourState(prev => ({ ...prev, run: false }));
  };

  const showContextualHelp = (stepIndex: number) => {
    setContextualHelp({ show: true, stepIndex });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <CustomTour
        steps={tourState.steps}
        isRunning={tourState.run}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
      />

      {/* Contextual Help */}
      <CustomTour
        steps={tourState.steps}
        isRunning={contextualHelp.show}
        onComplete={() => setContextualHelp({ show: false, stepIndex: -1 })}
        onSkip={() => setContextualHelp({ show: false, stepIndex: -1 })}
        specificStep={contextualHelp.stepIndex}
        isContextualHelp={true}
      />

      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="tour-welcome">
              <h1 className="text-2xl font-bold gradient-text">Custom Tour Demo</h1>
              <p className="text-muted-foreground">Experience interactive guided tours without external libs</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="tour"
                size="lg"
                onClick={startTour}
                disabled={tourState.run}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Start Tour
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={resetTour}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="tour-help"
                onClick={() => showContextualHelp(4)}
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="tour-stats space-y-4">
          <h2 className="text-xl font-semibold">Analytics Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300 relative group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">12,847</p>
                    <p className="text-xs text-success flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      +12% from last month
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-8 w-8 text-primary" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => showContextualHelp(1)}
                    >
                      <HelpCircle className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">$54,231</p>
                    <p className="text-xs text-success flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      +8.1% from last month
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold">3.24%</p>
                    <p className="text-xs text-success flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      +2.4% from last month
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-soft hover:shadow-medium transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Satisfaction</p>
                    <p className="text-2xl font-bold">4.8/5</p>
                    <p className="text-xs text-success flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-current" />
                      98% positive reviews
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feature Showcase */}
        <div className="tour-features space-y-4">
          <h2 className="text-xl font-semibold">Featured Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="group hover:shadow-medium transition-all duration-300 hover:scale-105 relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Lightning Fast</CardTitle>
                      <CardDescription>Built for speed and performance</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => showContextualHelp(2)}
                  >
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Experience blazing fast load times and smooth interactions powered by modern technology.
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary">React</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                  <Badge variant="secondary">Vite</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-medium transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">User-Friendly</CardTitle>
                    <CardDescription>Intuitive and accessible design</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Designed with users in mind, featuring guided tours and helpful interactions.
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary">Accessibility</Badge>
                  <Badge variant="secondary">UX</Badge>
                  <Badge variant="secondary">Tours</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-medium transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Settings className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Customizable</CardTitle>
                    <CardDescription>Tailored to your needs</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Highly customizable tours and interfaces that adapt to your specific requirements.
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary">Flexible</Badge>
                  <Badge variant="secondary">Adaptive</Badge>
                  <Badge variant="secondary">Custom</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="tour-actions space-y-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="hero" size="lg" className="gap-2">
              <Star className="h-5 w-5" />
              Get Started
            </Button>
            <Button variant="accent" size="lg" className="gap-2">
              <Target className="h-5 w-5" />
              View Demo
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <HelpCircle className="h-5 w-5" />
              Learn More
            </Button>
            <Button variant="secondary" size="lg" className="gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </Button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="pt-8 text-center">
          <p className="text-muted-foreground">
            This demo showcases a custom tour system with modern design and React components
          </p>
        </div>
      </div>
    </div>
  );
};

export default TourDemo;