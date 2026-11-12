export type Address = { adressetekst: string; postnummer: string; poststed: string };

export async function searchAddresses(query: string, signal: AbortSignal): Promise<Address[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('Adressesøket tok for lang tid')), 5_000);

  try {
    const response = await fetch(`https://ws.geonorge.no/adresser/v1/sok?fuzzy=true&treffPerSide=5&sok=${encodeURIComponent(query)}`, {
      signal: AbortSignal.any([signal, controller.signal]),
    });
    if (!response.ok) throw new Error('Adressesøk feilet');
    const data: unknown = await response.json();
    if (typeof data !== 'object' || data === null || !('adresser' in data) || !Array.isArray(data.adresser)) throw new Error('Ugyldig adressesvar');
    return data.adresser.filter((address: unknown): address is Address => typeof address === 'object' && address !== null && 'adressetekst' in address && typeof address.adressetekst === 'string' && 'postnummer' in address && typeof address.postnummer === 'string' && 'poststed' in address && typeof address.poststed === 'string');
  } finally {
    clearTimeout(timeout);
  }
}
