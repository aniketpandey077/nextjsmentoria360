"use client";
import { useRouter } from "next/navigation";
import StudentDashboard from "@/src/components/student/StudentDashboard";

export default function Page() {
  const router = useRouter();
  return <StudentDashboard setActive={(page) => router.push(`/student/${page}`)} />;
}
