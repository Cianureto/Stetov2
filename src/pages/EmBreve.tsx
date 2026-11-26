import { Hammer } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import { itemAtivo, secoesVisiveis } from "@/lib/navegacao";

/** Tela ainda não migrada do app antigo: título do menu e o que vai entrar aqui. */
export default function EmBreve({ itens }: { itens: string[] }) {
  const { pathname } = useLocation();
  const { usuario } = useAuth();
  const ativo = itemAtivo(pathname, secoesVisiveis(usuario));
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        {ativo && <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{ativo.secao.titulo}</p>}
        <h1 className="font-titulo text-2xl font-bold">{ativo?.item.label ?? "Em construção"}</h1>
      </header>
      <div className="card flex items-start gap-4 p-5 sm:p-6">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-marca-claro text-marca">
          <Hammer className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-titulo text-[15px] font-semibold">Tela em construção</h2>
          <p className="mt-0.5 text-sm text-foreground-muted">O que vai entrar aqui, trazido do app atual:</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {itens.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
