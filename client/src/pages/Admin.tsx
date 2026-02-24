import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Admin() {
  // admin page removed
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/");
  }, [navigate]);
  return null;
}
