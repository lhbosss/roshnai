import * as React from "react";

export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        "rounded-lg border bg-white text-gray-900 shadow-sm dark:border-gray-800 dark:bg-neutral-900 dark:text-gray-100 " +
        className
      }
      {...props}
    />
  );
}
