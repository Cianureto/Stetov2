import { z } from "zod";
import { erroHttp, rota } from "@/api/client";
import { supabase } from "@/api/supabase";
import type { Categoria } from "@/api/types";
import { validar } from "@/api/validacao";

const nomeSchema = z.object({ nome: z.string().trim().min(2, "Informe o nome.").max(80), ativo: z.boolean().optional() });

/** Categorias com as subcategorias, em ordem alfabética (listas curtas: vêm inteiras). */
rota("GET", "/categorias-contas", async (): Promise<Categoria[]> => {
  const { data, error } = await supabase.from("categorias_contas").select("id, nome, ativo, subcategorias:subcategorias_contas(id, nome, ativo)").order("nome");
  if (error) throw error;
  return data.map((c) => ({ ...c, subcategorias: [...c.subcategorias].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")) }));
});

rota("POST", "/categorias-contas", async ({ corpo }) => {
  const { nome } = validar(nomeSchema, corpo);
  const { data, error } = await supabase.from("categorias_contas").insert({ nome }).select("id, nome, ativo").single();
  if (error?.code === "23505") throw erroHttp(409, `Já existe a categoria "${nome}".`);
  if (error) throw error;
  return { ...data, subcategorias: [] };
});

rota("PATCH", "/categorias-contas/:id", async ({ params, corpo }) => {
  const d = validar(nomeSchema, corpo);
  const { error, count } = await supabase.from("categorias_contas").update(d, { count: "exact" }).eq("id", params.id);
  if (error?.code === "23505") throw erroHttp(409, `Já existe a categoria "${d.nome}".`);
  if (error) throw error;
  if (!count) throw erroHttp(404, "Categoria não encontrada.");
  return { ok: true };
});

rota("DELETE", "/categorias-contas/:id", async ({ params }) => {
  const { count: usadas } = await supabase.from("contas").select("*", { count: "exact", head: true }).eq("categoria_id", params.id);
  if (usadas) throw erroHttp(409, `Esta categoria está em ${usadas} conta(s). Inative-a em vez de excluir.`);
  const { error, count } = await supabase.from("categorias_contas").delete({ count: "exact" }).eq("id", params.id);
  if (error) throw error;
  if (!count) throw erroHttp(404, "Categoria não encontrada.");
  return { ok: true };
});

rota("POST", "/categorias-contas/:id/subcategorias", async ({ params, corpo }) => {
  const { nome } = validar(nomeSchema, corpo);
  const { data, error } = await supabase.from("subcategorias_contas").insert({ nome, categoria_id: params.id }).select("id, nome, ativo").single();
  if (error?.code === "23505") throw erroHttp(409, `Já existe a subcategoria "${nome}" nesta categoria.`);
  if (error) throw error;
  return data;
});

rota("PATCH", "/subcategorias-contas/:id", async ({ params, corpo }) => {
  const d = validar(nomeSchema, corpo);
  const { error, count } = await supabase.from("subcategorias_contas").update(d, { count: "exact" }).eq("id", params.id);
  if (error?.code === "23505") throw erroHttp(409, `Já existe a subcategoria "${d.nome}".`);
  if (error) throw error;
  if (!count) throw erroHttp(404, "Subcategoria não encontrada.");
  return { ok: true };
});

rota("DELETE", "/subcategorias-contas/:id", async ({ params }) => {
  const { count: usadas } = await supabase.from("contas").select("*", { count: "exact", head: true }).eq("subcategoria_id", params.id);
  if (usadas) throw erroHttp(409, `Esta subcategoria está em ${usadas} conta(s). Inative-a em vez de excluir.`);
  const { error, count } = await supabase.from("subcategorias_contas").delete({ count: "exact" }).eq("id", params.id);
  if (error) throw error;
  if (!count) throw erroHttp(404, "Subcategoria não encontrada.");
  return { ok: true };
});
