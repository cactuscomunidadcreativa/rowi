import { redirect } from "next/navigation";
export default function ClientsRedirect() {
  redirect("/workspace?type=CONSULTING");
}
