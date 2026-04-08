import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/";
  return url.endsWith("/") ? url : `${url}/`;
}