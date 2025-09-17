import * as React from "react";

export function Avatar({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        "relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-200 " +
        className
      }
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img className="h-full w-full object-cover" {...props} />;
}

export function AvatarFallback({ children }: { children?: React.ReactNode }) {
  return <span className="text-sm text-gray-600">{children}</span>;
}
