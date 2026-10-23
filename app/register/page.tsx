import { redirect } from "next/navigation";
import { register } from "@/app/actions/auth";
import { AuthForm } from "@/components/AuthForm";
import { getUser, homeFor } from "@/lib/auth";

export const metadata = { title: "Register" };

export default async function Page() {
  const u = await getUser();
  if (u) redirect(homeFor(u.role));
  return <AuthForm action={register} mode="register" />;
}
