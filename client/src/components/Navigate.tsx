import { useEffect } from "react";
import { useLocation } from "wouter";

interface NavigateProps {
  to: string;
}

export default function Navigate({ to }: NavigateProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);

  return null;
}