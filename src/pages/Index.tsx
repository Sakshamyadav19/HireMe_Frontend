import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Briefcase, Rocket, Star, CheckCircle, FileText, Target, PartyPopper } from "lucide-react";

const FloatingIcon = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`absolute text-2xl opacity-20 select-none pointer-events-none ${className}`}>
    {children}
  </div>
);

const AnimatedCounter = ({ end, label, delay }: { end: string; label: string; delay: string }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const ms = parseFloat(delay) * 1000;
    const t = setTimeout(() => setVisible(true), ms);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className="text-center transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.5)",
      }}
    >
      <span className="text-2xl md:text-3xl font-900 font-extrabold gradient-text">{end}</span>
      <p className="text-xs md:text-sm text-muted-foreground font-semibold mt-1">{label}</p>
    </div>
  );
};

const steps = [
  { icon: FileText, title: "Upload Resume", emoji: "📄", color: "text-purple" },
  { icon: Target, title: "Get Matched", emoji: "🎯", color: "text-teal" },
  { icon: PartyPopper, title: "Land the Job", emoji: "🎉", color: "text-pink" },
];

const Index = () => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col relative bg-background">
      {/* Floating background icons */}
      <FloatingIcon className="top-[15%] left-[8%] floating-icon">
        <Briefcase className="w-8 h-8 text-purple" />
      </FloatingIcon>
      <FloatingIcon className="top-[20%] right-[10%] floating-icon-delay-1">
        <Rocket className="w-7 h-7 text-pink" />
      </FloatingIcon>
      <FloatingIcon className="bottom-[30%] left-[12%] floating-icon-delay-2">
        <Star className="w-6 h-6 text-yellow" />
      </FloatingIcon>
      <FloatingIcon className="bottom-[25%] right-[8%] floating-icon-delay-3">
        <CheckCircle className="w-7 h-7 text-teal" />
      </FloatingIcon>
      <FloatingIcon className="top-[40%] left-[3%] floating-icon-delay-3">
        <Star className="w-5 h-5 text-pink" />
      </FloatingIcon>
      <FloatingIcon className="top-[10%] right-[30%] floating-icon-delay-2">
        <Briefcase className="w-5 h-5 text-teal" />
      </FloatingIcon>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-4 relative z-10">
        <h1 className="text-xl md:text-2xl font-extrabold gradient-text tracking-tight">
          JobMatch 🚀
        </h1>
        <Button className="bounce-hover rounded-full px-6 font-bold bg-primary text-primary-foreground shadow-lg">
          Get Started
        </Button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 -mt-4">
        <div
          className="text-center max-w-2xl transition-all duration-700"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(30px)",
          }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight gradient-text mb-4">
            Upload Your Resume.
            <br />
            Land Your Dream Job. 🚀
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-semibold max-w-lg mx-auto mb-8">
            We match you with jobs that actually fit — no endless scrolling required.
          </p>
          <Button
            size="lg"
            className="pulse-cta bounce-hover rounded-full px-10 py-6 text-lg font-extrabold bg-primary text-primary-foreground shadow-xl"
          >
            Get Started ✨
          </Button>
        </div>

        {/* 3-Step Cards */}
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 mt-10 md:mt-14">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="bg-card border border-border rounded-2xl px-6 py-5 text-center shadow-md hover:scale-105 transition-transform duration-300 cursor-default"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.6s ease ${0.3 + i * 0.2}s`,
              }}
            >
              <div className="text-3xl mb-2">{step.emoji}</div>
              <p className={`font-bold text-sm md:text-base ${step.color}`}>{step.title}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Stats Strip */}
      <footer className="flex items-center justify-center gap-8 md:gap-16 px-6 py-5 relative z-10">
        <AnimatedCounter end="10K+" label="Jobs" delay="0.8" />
        <div className="w-px h-8 bg-border" />
        <AnimatedCounter end="5K+" label="Companies" delay="1.0" />
        <div className="w-px h-8 bg-border" />
        <AnimatedCounter end="50K+" label="Matched" delay="1.2" />
      </footer>
    </div>
  );
};

export default Index;
