// src/features/visits/hooks/useVisitDraft.ts
"use client";

import { useMemo, useState } from "react";
import type {
  VisitItemRequest,
  PaymentRequest,
} from "@/features/visits/api/visitsApi";
import type { ClientResponse, ClientPetResponse } from "@/features/clients/api/clientsApi";

export function useVisitDraft() {
  const [client, setClient] = useState<ClientResponse | null>(null);
  const [pet, setPet] = useState<ClientPetResponse | null>(null);

  const [items, setItems] = useState<VisitItemRequest[]>([]);
  const [payment, setPayment] = useState<PaymentRequest | null>(null);

  const total = useMemo(
    () => items.reduce((sum, it) => sum + it.price, 0),
    [items]
  );

  return {
    client,
    setClient,
    pet,
    setPet,
    items,
    setItems,
    payment,
    setPayment,
    total,
  };
}
