"use client";
import UserProfileHeader from "@/components/users/UserProfileHeader";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { IUser } from "@/types/user.types";

const UserProfilePage = () => {
  const user: IUser = useSelector((state: RootState) => state.auth.user);

  return (
    <div>
      <UserProfileHeader user={user} />
    </div>
  );
};

export default UserProfilePage;
