import { Nav } from "@/components/Nav";
import { PositionDetailPage } from "@/components/liquidity";

export const metadata = {
  title: "Position, PrigeeX",
};

export default async function PositionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Nav />
      <main className="app-main">
        <div className="container-app">
          <PositionDetailPage tokenId={id} />
        </div>
      </main>
    </>
  );
}
