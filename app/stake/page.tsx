import { Nav } from "@/components/Nav";
import { StakePage } from "@/components/stake";

export const metadata = {
  title: "Stake, PrigeeX",
};

export default function Stake() {
  return (
    <>
      <Nav />
      <main className="app-main">
        <div className="container-app">
          <div className="page-head">
            <div className="sec-num">Stake</div>
            <h1>
              Stake PGX, share in <em>protocol revenue.</em>
            </h1>
          </div>
          <StakePage />
        </div>
      </main>
    </>
  );
}
