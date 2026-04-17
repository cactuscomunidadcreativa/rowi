import { redirect } from "next/navigation";
export default function TeamRedirect() {
  redirect("/workspace?type=TEAM_UNIT");
}
