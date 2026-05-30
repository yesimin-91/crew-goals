import { Link } from "react-router-dom";

type ActionTone = "primary" | "secondary" | "ghost";

interface SharedActionProps {
  tone?: ActionTone;
  block?: boolean;
  children: React.ReactNode;
}

interface ActionLinkProps extends SharedActionProps {
  to: string;
}

interface ActionButtonProps extends SharedActionProps {
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}

function getActionClassName(tone: ActionTone, block: boolean) {
  const blockClass = block ? " action--block" : "";
  return `action action--${tone}${blockClass}`;
}

export function ActionLink({
  tone = "primary",
  block = false,
  to,
  children
}: ActionLinkProps) {
  return (
    <Link className={getActionClassName(tone, block)} to={to}>
      {children}
    </Link>
  );
}

export function ActionButton({
  tone = "primary",
  block = false,
  type = "button",
  disabled = false,
  onClick,
  children
}: ActionButtonProps) {
  return (
    <button
      className={getActionClassName(tone, block)}
      type={type}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
