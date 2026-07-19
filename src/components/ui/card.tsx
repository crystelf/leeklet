import { cn } from "@/lib/cn";
import "./ui.css";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  soft?: boolean;
}

export function Card({ soft, className, ...rest }: CardProps) {
  return (
    <div className={cn(soft ? "card-soft" : "card", className)} {...rest} />
  );
}

export function CardBody({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-pad", className)} {...rest} />;
}
