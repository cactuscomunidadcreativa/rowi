import { redirect } from "next/navigation";
export default function HrRedirect() {
  redirect("/workspace?type=HR_COHORT");
}
