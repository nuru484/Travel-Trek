"use client";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useLogoutMutation } from "@/redux/auth/authApi";
import { extractApiErrorMessage } from "../../utils/extractApiErrorMessage";

export default function LogoutButton() {
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      router.push("/");
      toast.success("Logout successful");
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 transition-all duration-200 hover:bg-muted"
    >
      <LogOut className="h-4 w-4 text-muted-foreground" />
      <span>{isLoading ? "Logging out..." : "Logout"}</span>
    </Button>
  );
}
