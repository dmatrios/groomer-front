export type ClientResponse = {
  id: number;
  code: string;
  firstName: string;
  lastName: string;
  zoneId: number | null;
  zoneText: string | null;
  notes?: string;
  active: boolean;
};

export type ClientDetailResponse = ClientResponse;

export type ClientPhoneResponse = {
  id: number;
  phone: string;
  active: boolean;
};
