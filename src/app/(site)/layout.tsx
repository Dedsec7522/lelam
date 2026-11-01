import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TabBar } from "@/components/layout/tab-bar";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { ChatWidget } from "@/components/chat/chat-widget";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
      <TabBar />
      <CookieBanner />
      <ChatWidget />
    </>
  );
}
