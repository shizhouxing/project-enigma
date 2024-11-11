"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AuthMonitor from "@/hooks/useCookieCheck";


export default async function Page() {

  return (<>
      <AuthMonitor>
        <></>
      </AuthMonitor>

      </>
  );
}
