import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { registrarConfirmador, type Pedido } from "@/components/ui/confirmar";

export function Confirmador() {
  const [pedido, setPedido] = useState<Pedido | null>(null);

  useEffect(() => {
    registrarConfirmador(setPedido);
    return () => registrarConfirmador(null);
  }, []);

  function fechar(ok: boolean) {
    pedido?.responder(ok);
    setPedido(null);
  }

  return (
    <Dialog open={!!pedido} onOpenChange={(aberto) => !aberto && fechar(false)}>
      <DialogContent hideClose className="md:max-w-sm">
        <DialogHeader>
          <DialogTitle>{pedido?.titulo}</DialogTitle>
          {pedido?.descricao && <DialogDescription>{pedido.descricao}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="justify-end">
          <Button variant="ghost" onClick={() => fechar(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => fechar(true)} autoFocus>
            {pedido?.acao ?? "Remover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
