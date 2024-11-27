import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "RedArena Username",
  authors: { name: "LLMSYS", url: "https://lmsys.org/" },
  applicationName: "",
};

export default function UsernameRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
