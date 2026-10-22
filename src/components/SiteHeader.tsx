import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/server/auth/session";
import { initials } from "./initials";
import { Logo } from "./Logo";
import { ModeSwitch, ModeSwitchView } from "./ModeSwitch";
import { routes, secondaryNav } from "./navigation";

const navLink =
  "rounded-[calc(var(--u)*16)] px-[calc(var(--u)*8)] whitespace-nowrap transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-white";

/** Верхнее меню: синяя плашка с логотипом, ползунком режима, разделами и аватаром (макет «Стартовая страница»). */
export function SiteHeader() {
  return (
    <header className="relative z-10 px-[calc(var(--u)*40)] pt-[calc(var(--u)*35)] max-lg:px-3 max-lg:pt-3">
      <nav
        aria-label="Основное меню"
        className="bg-brand flex flex-wrap items-center rounded-[calc(var(--u)*31)] bg-[linear-gradient(180deg,rgb(255_255_255/0.08),rgb(255_255_255/0)_55%)] pr-[calc(var(--u)*17)] pl-[calc(var(--u)*14)] leading-none font-bold tracking-[-0.04em] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3),inset_0_-1px_0_rgb(0_0_0/0.08),var(--shadow-lift)] max-lg:gap-y-2 max-lg:py-2 lg:h-[calc(var(--u)*124)] lg:flex-nowrap lg:gap-[calc(var(--u)*28)] lg:text-[calc(var(--u)*44)]"
      >
        <Link
          href={routes.home}
          aria-label="Artel — на главную"
          className="shrink-0 rounded-[calc(var(--u)*16)] focus-visible:outline-2 focus-visible:outline-white"
        >
          <Logo tone="white" className="h-[calc(var(--u)*80)] w-auto max-lg:h-10" />
        </Link>

        <div className="shrink-0 max-lg:order-last max-lg:flex max-lg:basis-full max-lg:justify-center">
          <Suspense fallback={<ModeSwitchView active={null} />}>
            <ModeSwitch />
          </Suspense>
        </div>

        <ul className="flex items-center gap-[calc(var(--u)*44)] max-lg:ml-auto max-lg:gap-4 max-lg:text-base lg:flex-1">
          {secondaryNav.map((item, i) => (
            <li key={item.href} className={i === 0 ? "lg:ml-auto" : undefined}>
              <Link href={item.href} className={navLink}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <Suspense fallback={<Avatar href={routes.login} label="Войти" />}>
          <AccountAvatar />
        </Suspense>
      </nav>
    </header>
  );
}

/** Аватар справа: инициалы предприятия, если вошли, иначе серый кружок со ссылкой на вход. */
async function AccountAvatar() {
  const user = await getCurrentUser();
  if (!user) return <Avatar href={routes.login} label="Войти" />;
  const name = user.organization?.name ?? user.name;
  return (
    <Avatar href={routes.profile} label={`Личный кабинет: ${name}`} initials={initials(name)} />
  );
}

function Avatar({ href, label, initials }: { href: string; label: string; initials?: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="bg-brand-dark grid size-[calc(var(--u)*105)] shrink-0 place-items-center rounded-full border-[calc(var(--u)*11)] border-white/70 shadow-[var(--shadow-soft)] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white max-lg:ml-auto max-lg:size-11 max-lg:border-4"
    >
      {initials ? (
        <span className="text-[calc(var(--u)*36)] font-extrabold tracking-normal text-white max-lg:text-sm">
          {initials}
        </span>
      ) : (
        <span className="bg-brand-gray size-[calc(var(--u)*43)] rounded-full max-lg:size-4" />
      )}
    </Link>
  );
}
