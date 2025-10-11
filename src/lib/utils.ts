import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for intelligently merging Tailwind CSS class names.
 *
 * Combines the functionality of `clsx` (conditional class merging)
 * with `tailwind-merge` (resolving conflicts between Tailwind classes).
 *
 * Example usage:
 * <div className={cn(
 *   "base-classes", // always applied
 *   isActive && "bg-blue-500", // conditionally applied
 *   className // from component props
 * )} />
 *
 * @param inputs - CSS classes to merge (can be strings, objects, or undefined)
 * @returns A merged string of CSS classes with conflicts resolved
 */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
