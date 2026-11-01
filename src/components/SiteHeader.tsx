import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/app/login/actions";
import { GUEST_EMAIL } from "@/server/auth/accounts";
import { getCurrentUser } from "@/server/auth/session";
import { GuestLogin } from "./GuestLogin";
import { initials } from "./initials";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { ModeSwitch, ModeSwitchView } from "./ModeSwitch";
import { routes, secondaryNav } from "./navigation";

const navLink =
  "rounded-lg px-1 whitespace-nowrap transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-white";

const menuLink =
  "flex items-center justify-between rounded-2xl px-4 py-3 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white";

/**
 * Верхнее меню: тёмно-синяя плашка (#173780) с логотипом, ползунком режима, разделами и аватаром.
 * На телефоне — логотип, аватар и кнопка меню в одну строку, ползунок режима во всю ширину под ними.
 */
export function SiteHeader() {
  return (
    <header className="relative z-30 px-6 pt-4 max-lg:px-3 max-lg:pt-3">
      <nav
        aria-label="Основное меню"
        className="bg-brand-dark flex flex-wrap items-center rounded-2xl pr-2 pl-5 leading-none font-bold tracking-[-0.01em] text-white max-lg:gap-x-2 max-lg:gap-y-2.5 max-lg:rounded-3xl max-lg:p-2.5 max-lg:pl-4 lg:h-16 lg:flex-nowrap lg:gap-6 lg:text-base"
      >
        <Link
          href={routes.home}
          aria-label="Artel — на главную"
          className="shrink-0 rounded-[calc(var(--u)*16)] focus-visible:outline-2 focus-visible:outline-white max-lg:mr-auto"
        >
          <Logo tone="white" className="h-9 w-auto" />
        </Link>

        <div className="shrink-0 max-lg:order-last max-lg:basis-full">
          <Suspense fallback={<ModeSwitchView active={null} />}>
            <ModeSwitch />
          </Suspense>
        </div>

        <ul className="flex items-center gap-7 max-lg:hidden lg:flex-1">
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

        <Suspense fallback={<MenuButtonPlaceholder />}>
          <MobileMenu>
            <ul className="flex flex-col gap-1">
              {secondaryNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={menuLink}>
                    {item.label}
                    <Chevron />
                  </Link>
                </li>
              ))}
            </ul>
            <hr className="mx-4 my-1 border-white/15" />
            <Suspense>
              <MenuAccount />
            </Suspense>
          </MobileMenu>
        </Suspense>
      </nav>
    </header>
  );
}

/** Место под кнопку меню, пока адрес страницы не известен при пререндере. */
function MenuButtonPlaceholder() {
  return <span aria-hidden className="size-11 shrink-0 rounded-full bg-white/12 lg:hidden" />;
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 opacity-60" fill="none" aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Нижняя часть меню на телефоне: кабинет и выход или вход, в том числе гостевой. */
async function MenuAccount() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="flex flex-col gap-2 p-1">
        <Link href={routes.login} className={menuLink}>
          Войти
          <Chevron />
        </Link>
        <GuestLogin tone="light" />
      </div>
    );
  }
  const guest = user.email === GUEST_EMAIL;
  return (
    <div className="flex flex-col gap-1">
      <Link href={routes.profile} className={menuLink}>
        <span className="flex min-w-0 flex-col gap-1">
          Личный кабинет
          <span className="truncate text-sm font-normal text-white/70">
            {user.organization?.name ?? user.name}
            {guest && " · демо-режим"}
          </span>
        </span>
        <Chevron />
      </Link>
      <form action={logout}>
        <button
          type="submit"
          className={`${menuLink} w-full cursor-pointer text-left text-white/80`}
        >
          {guest ? "Выйти из демо-режима" : "Выйти"}
        </button>
      </form>
    </div>
  );
}

/** Аватар справа: инициалы предприятия, если вошли, иначе серый кружок со ссылкой на вход. */
async function AccountAvatar() {
  const user = await getCurrentUser();
  if (!user) return <Avatar href={routes.login} label="Войти" />;
  const name = user.organization?.name ?? user.name;
  const guest = user.email === GUEST_EMAIL;
  return (
    <Avatar
      href={routes.profile}
      label={`Личный кабинет: ${name}${guest ? " (демо)" : ""}`}
      initials={initials(name)}
      guest={guest}
    />
  );
}

function Avatar({
  href,
  label,
  initials,
  guest,
}: {
  href: string;
  label: string;
  initials?: string;
  guest?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="bg-brand relative grid size-11 shrink-0 place-items-center rounded-full border-[3px] border-white/70 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {initials ? (
        <span className="text-sm font-extrabold tracking-normal text-white">{initials}</span>
      ) : (
        <span className="bg-brand-gray size-4 rounded-full" />
      )}
      {guest && (
        <span className="text-brand-dark absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-300 px-1.5 py-0.5 text-[10px] leading-none font-extrabold tracking-normal uppercase">
          демо
        </span>
      )}
    </Link>
  );
}
