import { redirect } from "next/navigation";

export default function BrandRegisterPage() {
  redirect("/auth?tab=brand");
}
