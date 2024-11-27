import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "RedArena Username",
  authors: { name: "LLMSYS", url: "https://lmsys.org/" },
  applicationName: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
