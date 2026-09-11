import Image from "next/image";

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-[var(--sortd-bg)]">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Image
          src="/logo.png"
          alt="Sort'd"
          width={140}
          height={50}
          priority
          className="h-10 w-auto"
        />

        <p className="text-sm text-slate-500">
          Your day, simplified.
        </p>
      </div>
    </header>
  );
}