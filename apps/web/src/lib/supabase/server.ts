import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function serverAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        try {
          for (const { name, value, options } of values)
            store.set(name, value, options);
        } catch {
          /* Proxy refreshes cookies during server rendering. */
        }
      },
    },
  });
}
