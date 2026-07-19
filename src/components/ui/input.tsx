import { cn } from "@/lib/cn";
import "./ui.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className, id, ...rest }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}
      <input id={id} className={cn("input", className)} {...rest} />
      {hint && <p className="mt-1.5 text-xs" style={{ color: "var(--fg-muted)" }}>{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export function Textarea({ label, hint, className, id, ...rest }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}
      <textarea id={id} className={cn("textarea", className)} {...rest} />
      {hint && <p className="mt-1.5 text-xs" style={{ color: "var(--fg-muted)" }}>{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className, id, children, ...rest }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}
      <select id={id} className={cn("select", className)} {...rest}>
        {children}
      </select>
    </div>
  );
}
