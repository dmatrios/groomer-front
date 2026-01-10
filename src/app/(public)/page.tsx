import Link from "next/link";

export default function PublicHome() {
  return (
    <main className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Groomer App</h1>
      <p className="text-sm text-muted-foreground">Acceso (por ahora sin login)</p>

      <Link className="underline" href="/dashboard">
        Ir al Dashboard
      </Link>
    </main>
  );
}
