import type { GuestContent } from "@/lib/guest-content";

export type SignupStep = "profile" | "password" | "created" | "link" | "welcome";

export type SignupFormState = {
  firstName: string;
  lastName: string;
  email: string;
  /** ISO 3166-1 alpha-2 country code, e.g. "FR" */
  phoneCountry: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  confirmationNumber: string;
};

export type LinkedStay = {
  id: string;
  hotelId: string;
  hotelName: string;
  confirmationNumber: string;
  roomNumber: string | null;
  checkIn: string;
  checkOut: string;
  guests: { adults: number; children: number };
};

export type SignupStrings = GuestContent["pages"]["auth"]["signup"];

export const INITIAL_FORM: SignupFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phoneCountry: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  confirmationNumber: ""
};
