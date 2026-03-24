import { redirect } from "next/navigation";

export default function Home() {
  // Redirect any visitors at the root directly to the secure dashboard
  redirect("/protected");
}