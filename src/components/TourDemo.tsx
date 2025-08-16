import React, { useState, useCallback, useEffect, useMemo } from "react";
import { CustomTour } from "@/components/CustomTour";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  RotateCcw,
  Star,
  Users,
  TrendingUp,
  Settings,
  HelpCircle,
  Zap,
  Target,
  Award,
  BarChart3,
} from "lucide-react";
import { useLocalTokens } from "@/hooks/useLocalTokens";
import { hsl, tokensDark, tokensLight } from "@/styles/tokens";

interface TourStep {
  target: string;
  content: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right" | "center";
}

interface TourState {
  run: boolean;
  steps: TourStep[];
}

const TourDemo: React.FC = () => {
  const t = useLocalTokens();
  const keyframes = useMemo(
    () => `
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 0 0 ${hsl(t.primary, 0.5)}; }
      50% { box-shadow: 0 0 0 15px ${hsl(t.primary, 0)}; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-12px); }
    }
  `,
    [t.primary]
  );

  const [tourState, setTourState] = useState<TourState>({
    run: false,
    steps: [
      {
        target: ".tour-welcome",
        content: (
          <div className="space-y-3">
            <h3
              className="text-lg font-semibold"
              style={{ color: hsl(t.primary) }}
            >
              Welcome to our app! 🎉
            </h3>
            <p>
              Let me show you around our amazing dashboard and its powerful
              features.
            </p>
          </div>
        ),
        placement: "center",
      },
      {
        target: ".tour-stats",
        content: (
          <div className="space-y-3">
            <h3
              className="text-lg font-semibold"
              style={{ color: hsl(t.primary) }}
            >
              Analytics Overview
            </h3>
            <p>
              Here you can see your key performance metrics at a glance. These
              cards update in real-time to give you the latest insights.
            </p>
          </div>
        ),
      },
      {
        target: ".tour-features",
        content: (
          <div className="space-y-3">
            <h3
              className="text-lg font-semibold"
              style={{ color: hsl(t.primary) }}
            >
              Feature Showcase
            </h3>
            <p>
              This section highlights our main features. Each feature card shows
              detailed information and quick actions you can take.
            </p>
          </div>
        ),
      },
      {
        target: ".tour-actions",
        content: (
          <div className="space-y-3">
            <h3
              className="text-lg font-semibold"
              style={{ color: hsl(t.primary) }}
            >
              Quick Actions
            </h3>
            <p>
              Use these buttons to perform common tasks quickly. They're
              designed for maximum efficiency and ease of use.
            </p>
          </div>
        ),
      },
      {
        target: ".tour-help",
        content: (
          <div className="space-y-3">
            <h3
              className="text-lg font-semibold"
              style={{ color: hsl(t.primary) }}
            >
              Need Help? 💡
            </h3>
            <p>
              Click here anytime you need assistance. Our help system is
              context-aware and will provide relevant guidance.
            </p>
          </div>
        ),
      },
    ],
  });

  const [contextualHelp, setContextualHelp] = useState<{
    show: boolean;
    stepIndex: number;
  }>({
    show: false,
    stepIndex: -1,
  });

  const handleTourComplete = useCallback(() => {
    setTourState((prev) => ({ ...prev, run: false }));
  }, []);

  const handleTourSkip = useCallback(() => {
    setTourState((prev) => ({ ...prev, run: false }));
    setContextualHelp({ show: false, stepIndex: -1 });
  }, []);

  const startTour = () => setTourState((p) => ({ ...p, run: true }));
  const resetTour = () => setTourState((p) => ({ ...p, run: false }));
  const showContextualHelp = (stepIndex: number) =>
    setContextualHelp({ show: true, stepIndex });

  const [hoverStats0, setHoverStats0] = useState(false);
  const [hoverFeat0, setHoverFeat0] = useState(false);

  return (
    <div
      /* min-h-screen + bg-gradient-to-br from-background via-background to-muted */
      style={{
        minHeight: "100vh",
        background: `linear-gradient(to bottom right, ${hsl(t.background)}, ${hsl(
          t.background
        )}, ${hsl(t.muted)})`,
      }}
    >
      {/* Keyframes inline */}
      <style>{keyframes}</style>

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

      {/* Header (border-b bg-card/50 backdrop-blur-sm) */}
      <div
        style={{
          borderBottom: `1px solid ${hsl(t.border)}`,
          background: hsl(t.card, 0.5),
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="tour-welcome">
              <h1
                className="text-2xl font-bold"
                /* gradient-text */
                style={{
                  background:
                    tokensLight.gradientHero && tokensDark.gradientHero
                      ? document?.documentElement?.classList.contains("dark")
                        ? tokensDark.gradientHero
                        : tokensLight.gradientHero
                      : `linear-gradient(135deg, ${hsl(t.primary)}, ${hsl(t.accent)})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Custom Tour Demo
              </h1>
              <p style={{ color: hsl(t.mutedForeground) }}>
                Experience interactive guided tours without external libs
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="tour"
                size="lg"
                onClick={startTour}
                disabled={tourState.run}
                className="gap-2"
                style={{
                  background: `linear-gradient(135deg, ${hsl(t.primary)}, ${hsl(t.accent)})`,
                  color: "#fff",
                  boxShadow: `0 4px 15px -3px ${hsl(t.primary, 0.3)}`,
                  transition: "all 0.3s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 6px 20px -3px ${hsl(t.primary, 0.4)}`;
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 4px 15px -3px ${hsl(t.primary, 0.3)}`;
                  e.currentTarget.style.transform = "scale(1.0)";
                }}
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
            {/* Card 1 - com hover "group" simulado */}
            <Card
              onMouseEnter={(e) => {
                setHoverStats0(true);
                e.currentTarget.style.boxShadow = `0 10px 30px -5px ${hsl(t.primary, 0.2)}`;
                e.currentTarget.style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                setHoverStats0(false);
                e.currentTarget.style.boxShadow = `0 4px 15px -3px ${hsl(t.primary, 0.1)}`;
                e.currentTarget.style.transform = "scale(1.0)";
              }}
              style={{
                background: `linear-gradient(135deg, ${hsl(t.card)}, ${hsl(t.muted)})`,
                boxShadow: `0 4px 15px -3px ${hsl(t.primary, 0.1)}`,
                transition: "all 0.3s ease-in-out",
                position: "relative",
                borderRadius: "12px",
              }}
            >
              <CardContent style={{ padding: "1.5rem" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: hsl(t.mutedForeground) }}
                    >
                      Total Users
                    </p>
                    <p className="text-2xl font-bold">12,847</p>
                    <p
                      className="text-xs flex items-center gap-1 mt-1"
                      style={{ color: hsl(t.success) }}
                    >
                      <TrendingUp className="h-3 w-3" />
                      +12% from last month
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users
                      className="h-8 w-8"
                      style={{ color: hsl(t.primary) }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => showContextualHelp(1)}
                      style={{
                        opacity: hoverStats0 ? 1 : 0,
                        transition: "opacity 200ms ease",
                      }}
                    >
                      <HelpCircle
                        className="h-4 w-4"
                        style={{ color: hsl(t.primary) }}
                      />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              style={{
                background: document.documentElement.classList.contains("dark")
                  ? tokensDark.gradientCard
                  : tokensLight.gradientCard,
                boxShadow: document.documentElement.classList.contains("dark")
                  ? tokensDark.shadowSoft
                  : tokensLight.shadowSoft,
                transition: t.transitionSmooth,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  document.documentElement.classList.contains("dark")
                    ? tokensDark.shadowMedium
                    : tokensLight.shadowMedium)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow =
                  document.documentElement.classList.contains("dark")
                    ? tokensDark.shadowSoft
                    : tokensLight.shadowSoft)
              }
            >
              <CardContent style={{ padding: "1.5rem" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: hsl(t.mutedForeground) }}
                    >
                      Revenue
                    </p>
                    <p className="text-2xl font-bold">$54,231</p>
                    <p
                      className="text-xs flex items-center gap-1 mt-1"
                      style={{ color: hsl(t.success) }}
                    >
                      <TrendingUp className="h-3 w-3" />
                      +8.1% from last month
                    </p>
                  </div>
                  <BarChart3
                    className="h-8 w-8"
                    style={{ color: hsl(t.primary) }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card
              style={{
                background: document.documentElement.classList.contains("dark")
                  ? tokensDark.gradientCard
                  : tokensLight.gradientCard,
                boxShadow: document.documentElement.classList.contains("dark")
                  ? tokensDark.shadowSoft
                  : tokensLight.shadowSoft,
                transition: t.transitionSmooth,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  document.documentElement.classList.contains("dark")
                    ? tokensDark.shadowMedium
                    : tokensLight.shadowMedium)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow =
                  document.documentElement.classList.contains("dark")
                    ? tokensDark.shadowSoft
                    : tokensLight.shadowSoft)
              }
            >
              <CardContent style={{ padding: "1.5rem" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: hsl(t.mutedForeground) }}
                    >
                      Conversion Rate
                    </p>
                    <p className="text-2xl font-bold">3.24%</p>
                    <p
                      className="text-xs flex items-center gap-1 mt-1"
                      style={{ color: hsl(t.success) }}
                    >
                      <TrendingUp className="h-3 w-3" />
                      +2.4% from last month
                    </p>
                  </div>
                  <Target
                    className="h-8 w-8"
                    style={{ color: hsl(t.primary) }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card
              style={{
                background: document.documentElement.classList.contains("dark")
                  ? tokensDark.gradientCard
                  : tokensLight.gradientCard,
                boxShadow: document.documentElement.classList.contains("dark")
                  ? tokensDark.shadowSoft
                  : tokensLight.shadowSoft,
                transition: t.transitionSmooth,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  document.documentElement.classList.contains("dark")
                    ? tokensDark.shadowMedium
                    : tokensLight.shadowMedium)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow =
                  document.documentElement.classList.contains("dark")
                    ? tokensDark.shadowSoft
                    : tokensLight.shadowSoft)
              }
            >
              <CardContent style={{ padding: "1.5rem" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: hsl(t.mutedForeground) }}
                    >
                      Satisfaction
                    </p>
                    <p className="text-2xl font-bold">4.8/5</p>
                    <p
                      className="text-xs flex items-center gap-1 mt-1"
                      style={{ color: hsl(t.success) }}
                    >
                      <Star className="h-3 w-3" />
                      98% positive reviews
                    </p>
                  </div>
                  <Award
                    className="h-8 w-8"
                    style={{ color: hsl(t.primary) }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feature Showcase */}
        <div className="tour-features space-y-4">
          <h2 className="text-xl font-semibold">Featured Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              onMouseEnter={() => setHoverFeat0(true)}
              onMouseLeave={() => setHoverFeat0(false)}
              style={{
                transition: "all 0.3s ease-in-out",
                boxShadow: `0 4px 15px -3px ${hsl(t.primary, 0.1)}`,
                transform: hoverFeat0 ? "scale(1.05)" : "scale(1.0)",
                borderRadius: "12px",
              }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ background: hsl(t.primary, 0.1) }}
                    >
                      <Zap
                        className="h-6 w-6"
                        style={{ color: hsl(t.primary) }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Lightning Fast</CardTitle>
                      <CardDescription>
                        Built for speed and performance
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => showContextualHelp(2)}
                    style={{
                      opacity: hoverFeat0 ? 1 : 0,
                      transition: "opacity 200ms ease",
                    }}
                  >
                    <HelpCircle
                      className="h-4 w-4"
                      style={{ color: hsl(t.primary) }}
                    />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p
                  className="text-sm mb-4"
                  style={{ color: hsl(t.mutedForeground) }}
                >
                  Experience blazing fast load times and smooth interactions
                  powered by modern technology.
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary">React</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                  <Badge variant="secondary">Vite</Badge>
                </div>
              </CardContent>
            </Card>

            <Card
              style={{
                transition: t.transitionSmooth,
                boxShadow: document.documentElement.classList.contains("dark")
                  ? tokensDark.shadowSoft
                  : tokensLight.shadowSoft,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  document.documentElement.classList.contains("dark")
                    ? tokensDark.shadowMedium
                    : tokensLight.shadowMedium)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow =
                  document.documentElement.classList.contains("dark")
                    ? tokensDark.shadowSoft
                    : tokensLight.shadowSoft)
              }
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: hsl(t.accent, 0.1) }}
                  >
                    <Users
                      className="h-6 w-6"
                      style={{ color: hsl(t.accent) }}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">User-Friendly</CardTitle>
                    <CardDescription>
                      Intuitive and accessible design
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p
                  className="text-sm mb-4"
                  style={{ color: hsl(t.mutedForeground) }}
                >
                  Designed with users in mind, featuring guided tours and
                  helpful interactions.
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary">Accessibility</Badge>
                  <Badge variant="secondary">UX</Badge>
                  <Badge variant="secondary">Tours</Badge>
                </div>
              </CardContent>
            </Card>

            <Card
              style={{
                transition: t.transitionSmooth,
                boxShadow: document.documentElement.classList.contains("dark")
                  ? tokensDark.shadowSoft
                  : tokensLight.shadowSoft,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  document.documentElement.classList.contains("dark")
                    ? tokensDark.shadowMedium
                    : tokensLight.shadowMedium)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow =
                  document.documentElement.classList.contains("dark")
                    ? tokensDark.shadowSoft
                    : tokensLight.shadowSoft)
              }
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: hsl(t.success, 0.1) }}
                  >
                    <Settings
                      className="h-6 w-6"
                      style={{ color: hsl(t.success) }}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Customizable</CardTitle>
                    <CardDescription>Tailored to your needs</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p
                  className="text-sm mb-4"
                  style={{ color: hsl(t.mutedForeground) }}
                >
                  Highly customizable tours and interfaces that adapt to your
                  specific requirements.
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
          <p style={{ color: hsl(t.mutedForeground) }}>
            This demo showcases a custom tour system with modern design and
            React components
          </p>
        </div>
      </div>
    </div>
  );
};

export default TourDemo;
