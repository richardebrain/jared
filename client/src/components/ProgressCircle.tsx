import { cva } from "class-variance-authority";

interface ProgressCircleProps {
  value: number;
  color?: "primary" | "secondary" | "accent" | "destructive";
  size?: "sm" | "md" | "lg";
}

const circleVariants = cva("progress-circle border-4", {
  variants: {
    color: {
      primary: "border-primary",
      secondary: "border-secondary",
      accent: "border-accent",
      destructive: "border-destructive",
    },
    size: {
      sm: "h-10 w-10",
      md: "h-14 w-14",
      lg: "h-20 w-20",
    },
  },
  defaultVariants: {
    color: "primary",
    size: "md",
  },
});

export default function ProgressCircle({
  value,
  color = "primary",
  size = "md",
}: ProgressCircleProps) {
  // Ensure value is within 0-100 range
  const safeValue = Math.max(0, Math.min(100, value));
  
  // Create the conic gradient CSS style
  const getConicGradient = () => {
    const colorMap = {
      primary: "var(--primary)",
      secondary: "var(--secondary)",
      accent: "var(--accent)",
      destructive: "var(--destructive)",
    };
    
    const selectedColor = colorMap[color];
    
    return {
      background: `conic-gradient(${selectedColor} ${safeValue}%, hsl(var(--muted)) 0%)`,
    };
  };
  
  return (
    <div 
      className={circleVariants({ color, size })}
      data-progress={safeValue}
      style={getConicGradient()}
    />
  );
}
