import { Tabs, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { NoisePattern } from "@/components/noise_pattern";
import { AuthForms } from "@/components/auth_form";
import { checkUsername, login, signup } from "@/service/auth"
import { redirect } from "next/navigation";

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
    <div className="min-h-screen grid grid-cols-2 grid-flow-col">
      {/* Left section with testimonial */}
      <div className="bg-black p-8 md:flex flex-col justify-between relative overflow-hidden hidden">
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

      {/* Right section with auth forms */}
      <div className="flex flex-col justify-center p-8 bg-zinc-950">
        <div className="w-full max-w-md mx-auto space-y-6">
          <Tabs defaultValue="signup" className="w-full">
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  Welcome User
                </h1>
                <p className="text-sm text-zinc-400">
                  Sign in or create an account
                </p>
              </div>

              <AuthForms
                onUsernameSubmit={handleUsernameSubmit}
                onSignIn={handleSignIn}
                onSignUp={handleSignUp}
                error={[]}
              />

              <p className="text-center text-sm text-zinc-400">
                By clicking continue, you agree to our{" "}
                <Link href="/terms_of_service" className="underline underline-offset-4 hover:text-white">
                  Terms of Service
                </Link>{" "}
                {/* and{" "}
                <Link href="/privacy_policy" className="underline underline-offset-4 hover:text-white">
                  Privacy Policy
                </Link> */}
                .
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
