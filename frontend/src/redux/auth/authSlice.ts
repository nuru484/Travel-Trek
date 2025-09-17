import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IUserRegistrationResponseData } from "@/types/auth";

interface AuthState {
  user: IUserRegistrationResponseData | null;
}

// Load user from localStorage if available
const storedUser =
  typeof window !== "undefined" ? localStorage.getItem("user") : null;

const initialState: AuthState = {
  user: storedUser
    ? (() => {
        try {
          return JSON.parse(storedUser);
        } catch {
          return null;
        }
      })()
    : null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    userRegistration: (
      state,
      action: PayloadAction<{
        user: IUserRegistrationResponseData;
      }>
    ) => {
      state.user = action.payload.user;
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },

    userLoggedIn: (
      state,
      action: PayloadAction<{
        user: IUserRegistrationResponseData;
      }>
    ) => {
      state.user = action.payload.user;
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },

    userLoggedOut: (state) => {
      state.user = null;
      localStorage.removeItem("user");
    },
  },
});

export const { userRegistration, userLoggedIn, userLoggedOut } =
  authSlice.actions;

export default authSlice.reducer;
