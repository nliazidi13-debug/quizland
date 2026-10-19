import { SiteNavbar } from "@/components/quizland/site-navbar";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteNavbar />
      <main className="flex-1">{children}</main>
    </>
  );
}
