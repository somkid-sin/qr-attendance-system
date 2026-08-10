import { redirect } from "next/navigation";

import { getTeacher } from "@/lib/auth";

export default async function Home() {
  const teacher = await getTeacher();
  redirect(teacher ? "/teacher/sessions/new" : "/login");
}
