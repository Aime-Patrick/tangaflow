import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Presentation Viewer",
};

export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-black h-screen w-screen overflow-hidden">
      {children}
    </div>
  );
}
