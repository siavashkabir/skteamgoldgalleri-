import { redirect } from "next/navigation";
import { DEFAULT_STORE_SLUG } from "@/lib/storefront-types";

export default function Home() {
  redirect(`/${DEFAULT_STORE_SLUG}`);
}
