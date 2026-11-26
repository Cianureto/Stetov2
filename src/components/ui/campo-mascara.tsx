import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { CAMPOS, erroDoCampo, type TipoCampo } from "@/lib/mascaras";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  tipo: TipoCampo;
  valor: string;
  /** Recebe o valor já com a máscara. */
  onChange: (valor: string) => void;
  obrigatorio?: boolean;
  /** Nome do campo para a mensagem de obrigatório ("Informe o telefone."). */
  rotulo?: string;
  /** Ícone à esquerda, dentro do campo (dê `pl-9` em `className`); ou um elemento à direita, como um spinner. */
  icone?: ReactNode;
  aDireita?: ReactNode;
};

/**
 * Campo de formato conhecido (telefone, e-mail, CEP, CPF, CNPJ): aplica a máscara enquanto digita, abre o teclado
 * certo no celular e mostra o erro ao sair do campo (e some quando o valor fica certo). Valores antigos chegam
 * formatados. O formulário confere de novo no envio com `validarCampos` (lib/mascaras.ts).
 */
export const CampoMascara = forwardRef<HTMLInputElement, Props>(function CampoMascara({ tipo, valor, onChange, obrigatorio, rotulo, icone, aDireita, className, onBlur, id, ...props }, ref) {
  const config = CAMPOS[tipo];
  const idErro = useId();
  const [tocado, setTocado] = useState(false);
  const exibido = config.formatar(valor ?? "");
  const erro = tocado ? erroDoCampo(tipo, exibido, { obrigatorio, rotulo }) : null;
  return (
    <div className="min-w-0">
      <div className="relative">
        {icone}
        <Input
          ref={ref}
          id={id}
          type={config.type}
          inputMode={config.inputMode}
          autoComplete={config.autoComplete}
          placeholder={config.placeholder}
          maxLength={config.maxLength}
          required={obrigatorio}
          value={exibido}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? idErro : undefined}
          className={cn(erro && "border-[var(--danger)] focus:border-[var(--danger)]", className)}
          onChange={(e) => onChange(config.formatar(e.target.value))}
          onBlur={(e) => {
            setTocado(true);
            onBlur?.(e);
          }}
          {...props}
        />
        {aDireita}
      </div>
      {erro && (
        <p id={idErro} className="mt-1 text-[12px] text-[var(--danger)]">
          {erro}
        </p>
      )}
    </div>
  );
});
