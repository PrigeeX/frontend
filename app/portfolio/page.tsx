import { Nav } from "@/components/Nav";
import { PortfolioPage } from "@/components/portfolio";

export const metadata = {
  title: "Portfolio, PrigeeX",
};

export default function Portfolio() {
  return (
    <>
      <Nav />
      <main className="app-main">
        <div className="container-app">
          <div className="page-head">
            <div className="sec-num">Portfolio</div>
            <h1>
              Everything you hold, <em>in one place.</em>
            </h1>
          </div>
          <PortfolioPage />
        </div>
      </main>
    </>
  );
}
