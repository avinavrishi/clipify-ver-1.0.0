import { redirect } from "next/navigation";

export default function CreatorRegisterPage() {
  redirect("/auth?tab=creator");
}
