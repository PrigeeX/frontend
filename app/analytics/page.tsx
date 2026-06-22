import { Nav } from "@/components/Nav";
import { AnalyticsPage } from "@/components/analytics";

export const metadata = {
  title: "Analytics, PrigeeX",
};

export default function Analytics() {
  return (
    <>
      <Nav />
      <main className="app-main">
        <div className="container-app">
          <div className="page-head">
            <div className="sec-num">07, Analytics</div>
            <h1>
              The protocol, <em>measured.</em>
            </h1>
          </div>
          <AnalyticsPage />
        </div>
      </main>
    </>
  );
}
