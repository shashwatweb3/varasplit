export function LoadingSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-[#70ffc4]/18 bg-[#142a1f]/50 px-4 py-2 text-sm font-medium text-[rgba(236,255,247,0.78)] backdrop-blur">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#70ffc4]/20 border-t-[#69f5c7]" />
      <span>{label}</span>
    </div>
  );
}
