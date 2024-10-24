"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SignupFormSchema } from "@/lib/definition";
import { Alert, AlertDescription } from "../ui/alert";
import { Label } from "../ui/label";
import Link from "next/link";

const NoisePattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-32"
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 700 700"
    preserveAspectRatio="none"
  >
    <defs>
      <filter
        id="nnnoise-filter"
        x="-20%"
        y="-20%"
        width="140%"
        height="140%"
        filterUnits="objectBoundingBox"
        primitiveUnits="userSpaceOnUse"
        colorInterpolationFilters="linearRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.162"
          numOctaves="4"
          seed="15"
          stitchTiles="stitch"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          result="turbulence"
        />
        <feSpecularLighting
          surfaceScale="24"
          specularConstant="0.6"
          specularExponent="20"
          lightingColor="#ffffff"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          in="turbulence"
          result="specularLighting"
        >
          <feDistantLight azimuth="3" elevation="30" />
        </feSpecularLighting>
      </filter>
    </defs>
    <rect width="700" height="700" fill="transparent" />
    <rect
      width="700"
      height="700"
      fill="#ffffff"
      filter="url(#nnnoise-filter)"
    />
  </svg>
);

const AuthPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState("username"); // username, signin, signup
  const [error, setError] = useState("");

  // Simulate checking if user exists
  const checkUserExists = async (username: string) => {
    // Replace this with your actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate some existing usernames
        const existingUsers = ["john", "jane", "admin"];
        resolve(existingUsers.includes(username.toLowerCase()));
      }, 500);
    });
  };

  const handleUsernameSubmit = async () => {
    if (!username) {
      setError("Username is required");
      return;
    }

    try {
      const userExists = await checkUserExists(username);
      setStep(userExists ? "signin" : "signup");
      setError("");
    } catch (err) {
      setError("Error checking username");
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password) {
      setError("Password is required");
      return;
    }
    // Add your sign-in logic here
    console.log("Signing in:", { username, password });
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    // Add your sign-up logic here
    console.log("Signing up:", { username, password });
  };

  return (
    <div className="min-h-screen grid grid-cols-2">
      {/* Left section with testimonial */}
      <div className="bg-black p-8 flex flex-col justify-between relative overflow-hidden">
        <NoisePattern />
        {/* Content overlay */}
        <div className="relative z-10">
          <Link href={"/"}>
            <div className="flex items-center gap-2">
              <div className="h-[1.9rem] w-6 text-2xl text-white">{">"}</div>
              <span className="text-white font-semibold">Redteam Arena</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Right section with auth forms */}
      <div className="flex flex-col justify-center p-8 bg-zinc-950">
        <div className="w-full max-w-md mx-auto space-y-6">
          <Tabs defaultValue="signup" className="w-full">
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  {step === "username" && "Create an account"}
                  {step === "signin" && "Sign in"}
                  {step === "signup" && "Create account"}
                </h1>
                <p className="text-sm text-zinc-400">
                  {step === "username" &&
                    "Enter your username below to continue"}
                  {step === "signin" && "Enter your password to sign in"}
                  {step === "signup" &&
                    "Create a password for your new account"}
                </p>
              </div>

              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-900/20 border-red-900/50 text-red-400"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {step === "username" && (
                  <>
                    <Input
                      type="text"
                      placeholder="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                    <Button
                      className="w-full bg-white text-black hover:bg-gray-100"
                      onClick={handleUsernameSubmit}
                    >
                      Continue
                    </Button>
                  </>
                )}

                {step === "signin" && (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm text-zinc-400">
                        Signing in as {username}
                      </div>
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-white"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-white text-black hover:bg-gray-100"
                    >
                      Sign in
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-zinc-400 hover:text-white"
                      onClick={() => {
                        setStep("username");
                        setPassword("");
                        setError("");
                      }}
                    >
                      Use a different account
                    </Button>
                  </form>
                )}

                {step === "signup" && (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm text-zinc-400">
                        Creating account for {username}
                      </div>
                      <Label className="block mb-2 text-sm font-medium text-white pt-[0.1rem]">
                        Password
                        <Input
                          type="password"
                          placeholder="**************"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="mt-1 block w-full bg-zinc-900 border-zinc-800 text-white"
                        />
                      </Label>

                      <label className="block mb-2 text-sm font-medium text-white">
                        Confirm Password
                        <Input
                          type="password"
                          placeholder="**************"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="mt-1 block w-full bg-zinc-900 border-zinc-800 text-white"
                        />
                      </label>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-white text-black hover:bg-gray-100"
                    >
                      Create account
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-zinc-400 hover:text-white"
                      onClick={() => {
                        setStep("username");
                        setPassword("");
                        setConfirmPassword("");
                        setError("");
                      }}
                    >
                      Use a different username
                    </Button>
                  </form>
                )}

                <p className="text-center text-sm text-zinc-400">
                  By clicking continue, you agree to our{" "}
                  <a
                    href="/term_of_service"
                    className="underline underline-offset-4 hover:text-white"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy_policy"
                    className="underline underline-offset-4 hover:text-white"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
