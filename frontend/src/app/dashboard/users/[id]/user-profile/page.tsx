"use client";
import UserProfileHeader from "@/components/users/UserProfileHeader";
import { useGetUserQuery } from "@/redux/userApi";
import { extractApiErrorMessage } from "@/utils/extractApiErrorMessage";
import ErrorMessage from "@/components/ui/ErrorMessage";
import UserProfileHeaderSkeleton from "@/components/users/UserProfileHeaderSkeleton";
import { useParams } from "next/navigation";

const UserProfilePage = () => {
  const params = useParams<{ id: string }>();
  const userId = parseInt(params.id, 10);

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
    <div>
      <UserProfileHeader user={user} />
    </div>
  );
};

export default UserProfilePage;
