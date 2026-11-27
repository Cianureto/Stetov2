import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

// Interruptor: o trilho alinha a bolinha à esquerda ou à direita (justify-content) e a bolinha vai até lá
// numa animação de layout com mola; enquanto o dedo/mouse aperta, ela estica um pouco (como no iOS).
const MOLA = { type: "spring", bounce: 0.3, visualDuration: 0.3 } as const;

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, onPointerDown, onPointerUp, onPointerLeave, ...props }, ref) => {
  const [apertado, setApertado] = React.useState(false);
  return (
    <SwitchPrimitive.Root
      ref={ref}
      onPointerDown={(e) => {
        setApertado(true);
        onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        setApertado(false);
        onPointerUp?.(e);
      }}
      onPointerLeave={(e) => {
        setApertado(false);
        onPointerLeave?.(e);
      }}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-[var(--dur-media)]",
        "justify-start data-[state=checked]:justify-end",
        "data-[state=checked]:bg-marca data-[state=unchecked]:bg-tinta-300 hover:data-[state=unchecked]:bg-tinta-400",
        "focus-visible:outline-none focus-visible:shadow-[var(--anel-foco)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb asChild>
        <motion.span
          layout
          transition={MOLA}
          animate={{ width: apertado ? 23 : 18 }}
          className="pointer-events-none block h-[18px] rounded-full bg-white shadow-[0_2px_4px_rgba(11,27,54,0.2),0_0_0_0.5px_rgba(11,27,54,0.06)]"
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
});
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
