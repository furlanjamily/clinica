"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, []);

  return (
    <div className="flex flex-1 w-full bg-black space-x-3 rounded-r-2xl"></div>
  );
}
