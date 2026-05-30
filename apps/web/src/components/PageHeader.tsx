interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  trailing?: React.ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  trailing
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__body">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {trailing ? <div className="page-header__trailing">{trailing}</div> : null}
    </header>
  );
}
