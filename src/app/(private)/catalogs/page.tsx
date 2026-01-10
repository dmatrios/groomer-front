"use client";

import Link from "next/link";
import { MapPin, Scissors, Pill } from "lucide-react";

import { Card } from "@/shared/ui/components/Card";
import { Button } from "@/shared/ui/components/Button";

function CatalogCard(props: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Card className="flex flex-col justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
          {props.icon}
        </div>

        <div>
          <h3 className="font-semibold">{props.title}</h3>
          <p className="text-xs text-[color:var(--muted)]">
            {props.description}
          </p>
        </div>
      </div>

      <Link href={props.href}>
        <Button variant="primaryOutline" type="button">
          Gestionar
        </Button>
      </Link>
    </Card>
  );
}

export default function CatalogsIndexPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Catálogos</h2>
        <p className="text-sm text-[color:var(--muted)]">
          Configuración base del sistema.  
          Estas listas se usan en formularios como clientes y atenciones.
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CatalogCard
          icon={<MapPin className="h-5 w-5" />}
          title="Zonas"
          description="Distritos o áreas que se asignan a los clientes."
          href="/catalogs/zones"
        />

        <CatalogCard
          icon={<Scissors className="h-5 w-5" />}
          title="Tipos de tratamiento"
          description="Tipos usados cuando un servicio es de tipo médico."
          href="/catalogs/treatment-types"
        />

        <CatalogCard
          icon={<Pill className="h-5 w-5" />}
          title="Medicinas"
          description="Medicinas asociadas a tratamientos en las atenciones."
          href="/catalogs/medicines"
        />
      </div>
    </div>
  );
}
