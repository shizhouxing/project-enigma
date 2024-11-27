import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/context/user";

export const metadata: Metadata = {
  title: "RedArena Login",
  authors: { name: "LLMSYS", url: "https://lmsys.org/" },
  applicationName: "",
  description: "ReadArena Login Page",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
