"use client";

import { useEffect, useState } from "react";
import { cities, findCity, roadKm, transitDays, type City } from "./delivery";

const STORAGE_KEY = "artel:delivery-city";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const formatDay = (date: Date) =>
  new Intl.DateTimeFormat("ru-RU", { timeZone: "UTC", day: "numeric", month: "long" }).format(date);

/**
 * Расчёт доставки в блоке сделки: покупатель выбирает свой город, видит дату доставки
 * и маршрут на карте. `readyAt` — дата готовности (ISO), посчитанная на сервере.
 */
export function DeliveryEstimate({ origin, readyAt }: { origin: string; readyAt: string }) {
  const from = findCity(origin);
  const [destination, setDestination] = useState("Москва");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- город из прошлого визита известен только в браузере
      if (saved && findCity(saved)) setDestination(saved);
    } catch {
      // Хранилище недоступно (приватный режим): остаётся Москва.
    }
  }, []);

  function choose(name: string) {
    setDestination(name);
    try {
      window.localStorage.setItem(STORAGE_KEY, name);
    } catch {
      // Не сохранили — не страшно.
    }
  }

  const to = findCity(destination)!;
  const km = from ? roadKm(from, to) : null;
  const days = km === null ? null : transitDays(km);
  const deliveredAt = days === null ? null : new Date(Date.parse(readyAt) + days * MS_PER_DAY);

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center justify-between gap-3 text-base">
        <span className="text-gray-600">Доставка в</span>
        <select
          value={destination}
          onChange={(e) => choose(e.target.value)}
          className="text-brand-dark focus:border-brand-dark min-w-0 cursor-pointer rounded-lg border border-gray-200 bg-white px-2 py-1.5 font-bold outline-none"
        >
          {cities.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {from && deliveredAt && km !== null ? (
        <>
          <p className="text-base">
            <span className="font-bold text-gray-900">Доставим к {formatDay(deliveredAt)}</span>
            <span className="block text-sm text-gray-500">
              {from.name === to.name
                ? "Отгрузка в вашем городе, 1 день"
                : `${from.name} → ${to.name}, ≈ ${km.toLocaleString("ru-RU")} км, ${days} дн. в пути`}
            </span>
          </p>
          <RouteMap from={from} to={to} />
          <a
            href={`https://yandex.ru/maps/?rtext=${from.lat},${from.lon}~${to.lat},${to.lon}&rtt=auto`}
            target="_blank"
            rel="noreferrer"
            className="text-brand-dark self-start text-sm font-bold hover:underline"
          >
            Маршрут на Яндекс Картах ↗
          </a>
        </>
      ) : (
        <p className="text-sm text-gray-500">
          Производитель в г. {origin}: срок доставки назовёт вместе с ответом на сделку.
        </p>
      )}
    </div>
  );
}

const W = 320;
const H = 150;

/** Схема маршрута: города вокруг пути серыми точками, откуда и куда — фирменным синим. */
function RouteMap({ from, to }: { from: City; to: City }) {
  // Рамка вокруг двух городов с запасом; долготу сжимаем по широте, чтобы карта не растягивалась.
  const midLat = (from.lat + to.lat) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180);
  let minX = Math.min(from.lon, to.lon) * kx;
  let maxX = Math.max(from.lon, to.lon) * kx;
  let minY = Math.min(from.lat, to.lat);
  let maxY = Math.max(from.lat, to.lat);
  const span = Math.max(maxX - minX, (maxY - minY) * (W / H), 6);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  minX = cx - span * 0.65;
  maxX = cx + span * 0.65;
  const spanY = ((maxX - minX) * H) / W;
  minY = cy - spanY / 2;
  maxY = cy + spanY / 2;

  const project = (c: City) => ({
    x: ((c.lon * kx - minX) / (maxX - minX)) * W,
    y: ((maxY - c.lat) / (maxY - minY)) * H,
  });
  const a = project(from);
  const b = project(to);
  const same = from.name === to.name;
  // Дуга маршрута: изгиб вверх на четверть расстояния.
  const bend = Math.hypot(b.x - a.x, b.y - a.y) * 0.25;
  const control = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - bend };

  const others = cities
    .filter((c) => c.name !== from.name && c.name !== to.name)
    .map((c) => ({ c, ...project(c) }))
    .filter(({ x, y }) => x > 4 && x < W - 60 && y > 8 && y < H - 4)
    // Не подписываем города, которые налезают на точки маршрута.
    .filter(({ x, y }) => Math.hypot(x - a.x, y - a.y) > 28 && Math.hypot(x - b.x, y - b.y) > 28);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={same ? `Отгрузка в г. ${to.name}` : `Маршрут ${from.name} — ${to.name}`}
      className="bg-brand-mist w-full rounded-xl"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <path key={`v${i}`} d={`M${(W / 6) * i} 0V${H}`} stroke="#173780" strokeOpacity="0.06" />
      ))}
      {[1, 2].map((i) => (
        <path key={`h${i}`} d={`M0 ${(H / 3) * i}H${W}`} stroke="#173780" strokeOpacity="0.06" />
      ))}
      {others.map(({ c, x, y }) => (
        <g key={c.name} fill="#173780" fillOpacity="0.35">
          <circle cx={x} cy={y} r="2.5" />
          <text x={x + 5} y={y + 3.5} fontSize="9">
            {c.name}
          </text>
        </g>
      ))}
      {!same && (
        <path
          d={`M${a.x} ${a.y}Q${control.x} ${control.y} ${b.x} ${b.y}`}
          fill="none"
          stroke="#173780"
          strokeWidth="2.5"
          strokeDasharray="6 5"
          strokeLinecap="round"
        />
      )}
      <circle cx={a.x} cy={a.y} r="6" fill="#ffffff" stroke="#173780" strokeWidth="3" />
      <MapLabel x={a.x} y={a.y} text={from.name} />
      {!same && (
        <>
          <path
            d={`M${b.x} ${b.y}c-7-9-11-13-11-18a11 11 0 0 1 22 0c0 5-4 9-11 18Z`}
            fill="#173780"
          />
          <circle cx={b.x} cy={b.y - 18} r="4" fill="#ffffff" />
          <MapLabel x={b.x} y={b.y} text={to.name} />
        </>
      )}
    </svg>
  );
}

function MapLabel({ x, y, text }: { x: number; y: number; text: string }) {
  const right = x < W / 2;
  return (
    <text
      x={right ? x + 12 : x - 12}
      y={y + 4}
      textAnchor={right ? "start" : "end"}
      fontSize="11"
      fontWeight="700"
      fill="#111827"
      stroke="#eef2fb"
      strokeWidth="3"
      paintOrder="stroke"
    >
      {text}
    </text>
  );
}
