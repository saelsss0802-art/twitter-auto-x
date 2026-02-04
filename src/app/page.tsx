import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  return (
    <main>
      <section className="card">
        <h1>Twitter Auto X</h1>
        <p>Supabase クライアントが初期化されています。</p>
        <p>
          接続 URL: <code>{supabase.supabaseUrl}</code>
        </p>
        <ul>
          <li>Next.js(App Router) + TypeScript</li>
          <li>Supabase client 初期化</li>
          <li>環境変数は <code>.env.local</code> に設定</li>
        </ul>
      </section>
    </main>
  );
}
