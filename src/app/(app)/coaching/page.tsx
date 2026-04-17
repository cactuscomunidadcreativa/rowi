import { redirect } from "next/navigation";
export default function CoachingRedirect() {
  redirect("/workspace?type=COACHING");
}
