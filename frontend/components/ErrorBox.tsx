export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="rounded-[22px] border border-[#ff7f9b]/30 bg-[#180908]/70 px-4 py-3 text-sm font-medium text-[#ffd5de] shadow-[0_16px_50px_rgba(255,127,155,0.1)] backdrop-blur">
      {message}
    </div>
  );
}
