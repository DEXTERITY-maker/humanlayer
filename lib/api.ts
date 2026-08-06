/** Клиентский fetch-хелпер: JSON-обёртка с ошибками с сервера */
export async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok) {
    const msg = data?.error || `Ошибка ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}
