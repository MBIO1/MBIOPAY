import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatPhone(phone: string) {
  if (!phone) return "";
  if (phone.length <= 6) return phone;
  return `+${phone.slice(0, 3)} ${phone.slice(3, 6)} *** ${phone.slice(-3)}`;
}
