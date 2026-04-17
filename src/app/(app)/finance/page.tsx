import { redirect } from "next/navigation";
export default function FinanceRedirect() {
  redirect("/hub/admin/accounting/accounts");
}
