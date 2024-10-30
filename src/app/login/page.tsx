import { Tabs, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { NoisePattern } from "@/components/noise_pattern";
import { AuthForms } from "@/components/auth_form";
import { checkUsername, login, signup } from "@/service/auth";

export default async function AuthenticationPage() {
  async function handleUsernameSubmit(username: string) {
    "use server";
    const isAvailable = await checkUsername(username);
    return { step: isAvailable ? "signup" : "signin", username };
  }

  async function handleSignIn(formData: FormData) {
    "use server";
    const result = await login(formData);
    if (result.success) {
      return { success: true };
    }
    return { success: false, message: result.message };
  }

  async function handleSignUp(formData: FormData) {
    "use server";
    const result = await signup(formData);
    if (!result.success) {
      return { success: false, message: result.message };
    }
    return { success: true, step: "signin" };
  }

  return (
    <div className="min-h-screen flex flex-col md:grid md:grid-cols-2 md:grid-flow-col">
      {/* Left section with testimonial - hidden on mobile, shown on md+ screens */}
      <div className="hidden md:flex bg-black p-8 flex-col justify-between relative overflow-hidden">
        <NoisePattern />
        <div className="relative z-10">
          <Link href={"/"}>
            <div className="flex items-center gap-2">
              <div className="h-[1.9rem] w-6 text-2xl text-white">{">"}</div>
              <span className="text-white font-semibold">Redteam Arena</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Logo for mobile view - only shown on small screens */}
      <div className="md:hidden bg-black p-4">
        <Link href={"/"}>
          <div className="flex items-center gap-2 justify-center">
            <div className="h-[1.9rem] w-6 text-2xl text-white">{">"}</div>
            <span className="text-white font-semibold">Redteam Arena</span>
          </div>
        </Link>
      </div>

      {/* Right section with auth forms */}
      <div className="flex flex-col justify-center p-4 sm:p-6 md:p-8 bg-zinc-950 flex-grow">
        <div className="w-full max-w-md mx-auto space-y-6">
          <Tabs defaultValue="signup" className="w-full">
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2 text-center">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                  Welcome User
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Sign in or create an account
                </p>
              </div>

              <AuthForms
                onUsernameSubmit={handleUsernameSubmit}
                onSignIn={handleSignIn}
                onSignUp={handleSignUp}
                error={[]}
              />

              <p className="text-center text-xs sm:text-sm text-zinc-400 px-4">
                By clicking continue, you agree to our{" "}
                <Link
                  href="/terms_of_service"
                  className="underline underline-offset-4 hover:text-white"
                >
                  Terms of Service
                </Link>
                .
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
