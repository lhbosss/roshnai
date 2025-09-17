"use client";
type Props = { side?: "left" | "right"; children?: React.ReactNode };
export default function MessageBubble({ side = "left", children }: Props) {
  const isRight = side === "right";
  return (
    <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
          isRight ? "bg-blue-600 text-white" : "bg-gray-100"
        }`}
      >
        {children || (isRight ? "You: placeholder message" : "Them: placeholder message")}
      </div>
    </div>
  );
}
