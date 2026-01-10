type PetSpecies = "DOG" | "CAT";

const petSpeciesUI: Record<PetSpecies, { label: string }> = {
  DOG: { label: "Perro" },
  CAT: { label: "Gato" },
};

function petSpeciesLabel(species?: string | null) {
  if (!species) return "";
  return petSpeciesUI[species as PetSpecies]?.label ?? String(species);
}
