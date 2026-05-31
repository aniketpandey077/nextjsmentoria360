"use client";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/src/components/admin/AdminDashboard";
export default function Page() {
  const router = useRouter();
  return <AdminDashboard setActive={(page) => router.push(`/admin/${page}`)} />;
}

