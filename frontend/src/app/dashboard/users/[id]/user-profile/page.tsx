// src/app/dashboard/users/[id]/user-profile/page.tsx
"use client";
import UserProfileHeader from "@/components/users/UserProfileHeader";
import { useGetUserQuery } from "@/redux/userApi";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import ErrorMessage from "@/components/ui/ErrorMessage";
import UserProfileHeaderSkeleton from "@/components/users/UserProfileHeaderSkeleton";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { UserProfileBookings } from "@/components/bookings/UserProfileBookings";
import { UserProfilePayments } from "@/components/payments/UserProfilePayments";

const UserProfilePage = () => {
  const params = useParams<{ id: string }>();
  const userId = parseInt(params.id, 10);

  const currentUser = useSelector((state: RootState) => state.auth.user);

  const {
    data: userData,
    error,
    isError,
    isLoading,
    refetch,
  } = useGetUserQuery({
    userId,
  });

  const errorMessage = extractApiErrorMessage(error).message;

  if (isLoading) return <UserProfileHeaderSkeleton />;

  if (isError) return <ErrorMessage error={errorMessage} onRetry={refetch} />;

  const user = userData?.data;

  return (
    <div className="container mx-auto max-w-6xl space-y-8 py-6">
      <UserProfileHeader user={user} currentUser={currentUser} />

      {/* Recent Activity Section */}
      <div className="space-y-6">
        <UserProfileBookings userId={user.id} />
        <UserProfilePayments userId={user.id} />
      </div>
    </div>
  );
};

export default UserProfilePage;
