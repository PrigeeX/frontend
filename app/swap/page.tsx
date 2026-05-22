import { Nav } from "@/components/Nav";
import { SwapPage } from "@/components/swap";

export const metadata = {
  title: "Swap, PrigeeX",
};

export default function Swap() {
  return (
    <>
      <Nav />
      <main className="app-main">
        <div className="container-app">
          <div className="page-head">
            <div className="sec-num">04, Swap</div>
            <h1>
              Route a <em>trade.</em>
            </h1>
          </div>
          <SwapPage />
        </div>
      </main>
    </>
  );
}
