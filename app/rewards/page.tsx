import { Nav } from "@/components/Nav";
import { RewardsPage } from "@/components/rewards";

export const metadata = {
  title: "Rewards, PrigeeX",
};

export default function Rewards() {
  return (
    <>
      <Nav />
      <main className="app-main">
        <div className="container-app">
          <div className="page-head">
            <div className="sec-num">06, Rewards</div>
            <h1>
              Claim your <em>distribution.</em>
            </h1>
          </div>
          <RewardsPage />
        </div>
      </main>
    </>
  );
}
