import { Header } from "./header";
import { Footer } from "./footer";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-14">{children}</main>
      <Footer />
    </div>
  );
}
