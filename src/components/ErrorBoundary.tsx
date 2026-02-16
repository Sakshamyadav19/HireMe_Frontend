import { Component, type ErrorInfo, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[40vh] flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-destructive mb-2">Something went wrong</h2>
              <p className="text-sm text-muted-foreground mb-4 font-mono break-all">
                {this.state.error.message}
              </p>
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
