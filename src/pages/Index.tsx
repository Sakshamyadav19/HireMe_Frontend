import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Zap, TrendingUp, BookmarkCheck } from "lucide-react";

// Floating job card component
const FloatingCard = ({
  children,
  className,
  delay = "0s",
  duration = "6s",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: string;
  duration?: string;
}) => (
  <div
    className={`absolute bg-card rounded-2xl shadow-lg border border-border/50 backdrop-blur-sm px-4 py-3 ${className}`}
    style={{
      animation: `float-slow ${duration} ease-in-out ${delay} infinite`,
    }}
  >
    {children}
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleGetStarted = () => {
    if (user) navigate("/home");
    else navigate("/signup");
  };

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col relative">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(300,30%,95%)] via-[hsl(320,50%,88%)] to-[hsl(300,40%,85%)]" />

      {/* Wavy lines at bottom */}
      <svg
        className="absolute bottom-0 left-0 w-[200%] opacity-20"
        style={{ animation: "wave-drift 20s linear infinite" }}
        height="200"
        viewBox="0 0 2000 200"
        fill="none"
      >
        <path d="M0 80 Q250 20 500 80 T1000 80 T1500 80 T2000 80" stroke="hsl(320,50%,65%)" strokeWidth="1.5" fill="none" />
        <path d="M0 110 Q250 50 500 110 T1000 110 T1500 110 T2000 110" stroke="hsl(300,40%,60%)" strokeWidth="1" fill="none" />
        <path d="M0 140 Q250 80 500 140 T1000 140 T1500 140 T2000 140" stroke="hsl(310,45%,70%)" strokeWidth="1.5" fill="none" />
        <path d="M0 160 Q250 120 500 160 T1000 160 T1500 160 T2000 160" stroke="hsl(325,40%,75%)" strokeWidth="1" fill="none" />
      </svg>

      {/* Nav */}
      <nav
        className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5"
        style={{
          opacity: loaded ? 1 : 0,
          transform: loaded ? "translateY(0)" : "translateY(-10px)",
          transition: "all 0.6s ease 0.1s",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(320,60%,70%)] to-[hsl(280,50%,60%)] flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">HireMe</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/70">
          <a href="#" className="hover:text-foreground transition-colors">Find a Job</a>
          <a href="#" className="hover:text-foreground transition-colors">Companies</a>
          <a href="#" className="hover:text-foreground transition-colors">How It Works</a>
          <a href="#" className="hover:text-foreground transition-colors">Blog</a>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex text-sm font-medium" onClick={() => navigate("/login")}>
            Login
          </Button>
          <Button className="rounded-full px-6 text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity" onClick={() => navigate("/signup")}>
            Sign Up
          </Button>
        </div>
      </nav>

      {/* Main content area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6">
        {/* Floating cards - LEFT side */}
        <FloatingCard className="hidden lg:flex top-[8%] left-[6%] items-center gap-3" delay="0s" duration="7s">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(145,50%,60%)] to-[hsl(160,40%,50%)] flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Customer Success</p>
            <p className="text-sm font-bold text-foreground">7.89% <span className="text-[10px] bg-[hsl(0,70%,60%)] text-white px-1.5 py-0.5 rounded-full font-medium">HOT</span></p>
          </div>
        </FloatingCard>

        <FloatingCard className="hidden lg:flex top-[30%] left-[4%] flex-col gap-2 max-w-[220px]" delay="1s" duration="8s">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[hsl(145,60%,90%)] flex items-center justify-center">
              <span className="text-sm">🎵</span>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Product Designer</p>
              <p className="text-[10px] text-muted-foreground">Spotify · <span className="text-blue-500">✓</span></p>
            </div>
            <BookmarkCheck className="w-4 h-4 text-accent ml-auto" />
          </div>
          <div className="flex gap-1.5">
            <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground font-medium">Full Time</span>
            <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground font-medium">Remote</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> New York</p>
            <p className="text-sm font-bold text-foreground">$152K<span className="text-[10px] font-normal text-muted-foreground">/month</span></p>
          </div>
        </FloatingCard>

        <FloatingCard className="hidden lg:flex bottom-[18%] left-[5%] items-center gap-2" delay="2s" duration="6s">
          <div className="w-8 h-8 rounded-lg bg-[hsl(280,40%,90%)] flex items-center justify-center">
            <span className="text-sm">🎨</span>
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Product Design Manager</p>
            <p className="text-[10px] text-muted-foreground">Figma · Full Time</p>
          </div>
        </FloatingCard>

        {/* Floating cards - RIGHT side */}
        <FloatingCard className="hidden lg:flex top-[6%] right-[8%] items-center gap-2" delay="0.5s" duration="7s">
          <div className="w-8 h-8 rounded-full bg-[hsl(180,40%,90%)] flex items-center justify-center">
            <span className="text-sm">⚡</span>
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Design Engineer</p>
            <p className="text-[10px] text-muted-foreground">ChatGPT · Remote</p>
          </div>
        </FloatingCard>

        <FloatingCard className="hidden lg:flex top-[22%] right-[5%] flex-col gap-2 max-w-[200px] p-4" delay="1.5s" duration="8s">
          <p className="text-xs font-bold text-foreground">Top Job Categories</p>
          <div className="flex gap-1 items-end h-12">
            <div className="flex-1 bg-[hsl(30,60%,85%)] rounded-t-md h-[65%]" />
            <div className="flex-1 bg-[hsl(300,40%,85%)] rounded-t-md h-[79%]" />
            <div className="flex-1 bg-[hsl(320,50%,80%)] rounded-t-md h-[48%]" />
            <div className="flex-1 bg-gradient-to-t from-[hsl(320,60%,70%)] to-[hsl(280,50%,70%)] rounded-t-md h-[93%]" />
          </div>
          <div className="flex justify-between">
            <span className="text-[8px] text-muted-foreground">Product</span>
            <span className="text-[8px] text-muted-foreground">Content</span>
            <span className="text-[8px] text-muted-foreground">Finance</span>
            <span className="text-[8px] text-muted-foreground">Design</span>
          </div>
        </FloatingCard>

        <FloatingCard className="hidden lg:flex bottom-[16%] right-[6%] items-center gap-3" delay="0.8s" duration="6.5s">
          <div className="w-9 h-9 rounded-full bg-[hsl(45,90%,65%)] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">80%</p>
            <p className="text-[10px] text-muted-foreground">More Efficient</p>
          </div>
        </FloatingCard>

        {/* Center Hero */}
        <div
          className="text-center max-w-2xl"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s ease 0.2s",
          }}
        >
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] text-foreground mb-5">
            Modernizing the
            <br />
            Job Search Experience
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            Upload your resume and find your dream job easier than ever. We match you with roles that actually fit — no endless scrolling required.
          </p>

          <Button
            size="lg"
            className="rounded-full px-10 py-6 text-base font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-lg transition-all hover:scale-105"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(15px)",
              transition: "all 0.7s ease 0.5s",
            }}
            onClick={handleGetStarted}
          >
            {user ? "Upload resume" : "Get Started"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Index;
