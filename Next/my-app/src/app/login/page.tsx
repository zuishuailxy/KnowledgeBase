'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const handleLogin = async () => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
    const res = await response.json();
    if (res.code === 1) {
      router.push("/");
    }
  }

  return (
    <div className="mt-10 flex flex-col item-center justify-center gap-4">
      <Input
        type="text"
        placeholder="Username"  
        value={username}
        className="w-62.5"
        onChange={(e) => setUsername(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        className="w-62.5"
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button className="w-62.5 cursor-pointer" onClick={handleLogin}>Login</Button>
    </div>
  )
}



