import { QzLogo } from "@/components/quizland/qz-logo";

export default function GameLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#1A0E33]">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-center px-5 py-6">
        <QzLogo href={null} size={28} textClassName="text-base" />
      </header>
      <main className="flex flex-1 flex-col px-5 pb-16 sm:px-8">
        {children}
      </main>
    </div>
  );
}
