import { Nav } from "@/components/Nav";
import { AddLiquidityPage } from "@/components/liquidity";

export const metadata = {
  title: "New position, PrigeeX",
};

export default function NewPosition() {
  return (
    <>
      <Nav />
      <main className="app-main">
        <div className="container-app">
          <AddLiquidityPage />
        </div>
      </main>
    </>
  );
}
