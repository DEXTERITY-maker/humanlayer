export function CardSkeleton() {
  return (
    <div className="card animate-pulse p-5">
      <div className="mb-3 flex justify-between">
        <div className="h-5 w-16 rounded bg-navy-700" />
        <div className="h-5 w-24 rounded bg-navy-700" />
      </div>
      <div className="mb-2 h-5 w-3/4 rounded bg-navy-700" />
      <div className="mb-3 h-4 w-1/2 rounded bg-navy-700" />
      <div className="h-4 w-16 rounded bg-navy-700" />
    </div>
  );
}
