import { redirect } from "next/navigation";

/** Submissions are now per campaign under Participated campaigns. */
export default function SubmissionsRedirectPage() {
  redirect("/dashboard/campaigns");
}
