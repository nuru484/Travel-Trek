"use client";
import React from "react";
import { Provider } from "react-redux";
import store from "@/redux/store";

interface ProvidersProps {
  children: React.ReactNode;
}

export function StoreProvider({ children }: ProvidersProps) {
  return <Provider store={store}>{children}</Provider>;
}
