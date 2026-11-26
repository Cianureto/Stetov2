// Apaga só os dados de demonstração (legacy_id "demo-…"), na ordem das dependências.
//   STETO_EMAIL=... STETO_SENHA=... node scripts/demo/limpar.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(readFileSync(new URL("../../.env.local", import.meta.url), "utf8").split("\n").filter((l) => l.includes("=")).map((l) => l.split("=")));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_PUBLISHABLE_KEY.trim(), { auth: { persistSession: false } });
const { error } = await supabase.auth.signInWithPassword({ email: process.env.STETO_EMAIL, password: process.env.STETO_SENHA });
if (error) throw new Error(`Login: ${error.message}`);
const apagados = {};
for (const t of ["contas", "subcategorias_contas", "categorias_contas", "registros_financeiros", "prestadores", "clientes", "empresas_contabeis"]) {
  const { error: e, count } = await supabase.from(t).delete({ count: "exact" }).like("legacy_id", "demo-%");
  if (e) throw new Error(`${t}: ${e.message}`);
  apagados[t] = count;
}
await supabase.auth.signOut();
console.log(JSON.stringify(apagados));
