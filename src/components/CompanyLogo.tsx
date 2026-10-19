import { initials } from "./initials";

export type LogoOwner = { id: string; name: string; logo: { updatedAt: Date } | null };

/** Адрес логотипа; `v` меняется с каждой новой картинкой, поэтому браузер может её кешировать. */
export const logoSrc = (org: { id: string; logo: { updatedAt: Date } }) =>
  `/api/organizations/${encodeURIComponent(org.id)}/logo?v=${new Date(org.logo.updatedAt).getTime()}`;

/**
 * Логотип предприятия в квадрате со скруглением. Пока логотипа нет — буквы названия
 * на фирменном синем, как аватар в шапке. Размер задаёт `className` (по умолчанию 48 px).
 */
export function CompanyLogo({
  organization,
  className = "size-12 text-base",
}: {
  organization: LogoOwner;
  className?: string;
}) {
  if (organization.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- картинка из своей базы, оптимизатор не нужен
      <img
        src={logoSrc({ id: organization.id, logo: organization.logo })}
        alt={`Логотип ${organization.name}`}
        className={`shrink-0 rounded-[22%] bg-white object-contain ring-1 ring-gray-200 ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`bg-brand-dark grid shrink-0 place-items-center rounded-[22%] font-extrabold tracking-tight text-white ${className}`}
    >
      {initials(organization.name)}
    </span>
  );
}
