import * as Dialog from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-full border text-sm font-medium transition-transform duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border-teal bg-teal text-bg hover:opacity-90",
        ghost: "border-line bg-surface text-fg hover:border-teal",
        quiet: "border-transparent bg-transparent text-muted hover:text-fg",
        danger: "border-coral/40 bg-transparent text-coral hover:bg-coral/10",
      },
      size: {
        md: "min-h-11 px-4",
        sm: "min-h-11 px-3 text-xs",
      },
    },
    defaultVariants: { variant: "ghost", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-bg/75 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[min(88vh,820px)] w-[min(100%-1.5rem,36rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card border border-line bg-surface p-5 text-fg">
          <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
          {description ? <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description> : null}
          <div className="mt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const fieldClass = "min-h-11 w-full rounded-xl border border-line bg-raise px-3 text-sm text-fg outline-none";

export function TextField({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="grid gap-1 text-sm text-muted">
      <span>{label}</span>
      <input {...props} className={cn(fieldClass, props.className)} />
      {hint ? <span className="text-xs text-faint">{hint}</span> : null}
    </label>
  );
}

export function SelectField({
  label,
  hint,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm text-muted">
      <span>{label}</span>
      <select {...props} className={cn(fieldClass, props.className)}>
        {children}
      </select>
      {hint ? <span className="text-xs text-faint">{hint}</span> : null}
    </label>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "fg",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "fg" | "mint" | "coral" | "teal";
}) {
  const toneClass = tone === "mint" ? "text-mint" : tone === "coral" ? "text-coral" : tone === "teal" ? "text-teal" : "text-fg";
  return (
    <article className="rounded-card border border-line bg-surface/90 p-4">
      <p className="text-xs tracking-wide text-faint uppercase">{label}</p>
      <p className={cn("mt-2 font-mono text-2xl font-medium tabular-nums", toneClass)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </article>
  );
}
