import { AuctionCardSkeleton } from "@/components/auctions/auction-card";

export default function Loading() {
  return (
    <div className="container-page py-16" aria-busy="true" aria-label="Loading auctions">
      <div className="h-4 w-28 skeleton" />
      <div className="mt-4 h-10 w-2/3 skeleton" />
      <div className="mt-8 h-14 max-w-3xl skeleton rounded-2xl" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <AuctionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
