import { Nav } from "@/components/Nav";
import { PoolListPage } from "@/components/liquidity";

export const metadata = {
  title: "Liquidity, PrigeeX",
};

export default function Pool() {
  return (
    <>
      <Nav />
      <main className="app-main">
        <div className="container-app">
          <div className="page-head">
            <div className="sec-num">06, Liquidity</div>
            <h1>
              Provide liquidity, earn <em>every swap.</em>
            </h1>
          </div>
          <PoolListPage />
        </div>
      </main>
    </>
  );
}
