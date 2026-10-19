// Демо-производители с разной репутацией: на них видно, как ИИ-сводка подводит итог
// («Надёжный производитель», «Перекуп-пустышка», «Срывает сроки»…). Их использует сид.
import type { ExternalChecks } from "@/server/assessment/assess";
import type { DemoProduct } from "./demo-catalog";

type DocumentKind = "REGISTRATION" | "CERTIFICATE" | "LICENSE" | "FINANCIAL_REPORT" | "QUALITY";

export type DemoCompany = {
  /** Файл логотипа в `prisma/demo-logos`. */
  logo: string;
  organization: {
    name: string;
    inn: string;
    ogrn?: string;
    city: string;
    legalAddress?: string;
    description: string;
    website?: string;
    phone?: string;
    foundedYear: number;
    isSeller: boolean;
    isBuyer: boolean;
  };
  verified: boolean;
  documents: { kind: DocumentKind; title: string; number?: string; issuedAt: string }[];
  products: DemoProduct[];
  /** История сделок с демо-заказчиками: сколько завершено и сорвано, какие оценки. */
  reputation: { completed: number; cancelled: number; ratings: number[]; reviews: string[] };
  /** Что ИИ нашёл во внешних источниках. */
  external: ExternalChecks;
};

/** Отчётность за каждый год с `from` по 2025: сдаётся в марте следующего года. */
const financials = (from: number) =>
  Array.from({ length: 2026 - from }, (_, i) => ({
    kind: "FINANCIAL_REPORT" as const,
    title: `Бухгалтерская отчётность за ${from + i} год`,
    issuedAt: `${from + i + 1}-03-28`,
  }));

/** Заказчики, с которыми у демо-производителей история сделок. Без входа на сайт. */
export const demoCustomers = [
  { name: "ООО «Кубань-Агро»", inn: "2300000011", city: "Краснодар" },
  { name: "СПК «Колос»", inn: "6100000012", city: "Сальск" },
  { name: "АО «Хлебозавод № 3»", inn: "6300000013", city: "Самара" },
  { name: "ООО «Ставропольские нивы»", inn: "2600000014", city: "Ставрополь" },
];

export const demoCompanies: DemoCompany[] = [
  {
    logo: "ural.png",
    organization: {
      name: "АО «Уралподшипник»",
      inn: "6600000021",
      ogrn: "1026600000021",
      city: "Екатеринбург",
      legalAddress: "г. Екатеринбург, ул. Монтажников, 4",
      description:
        "Полный цикл производства шариковых и роликовых подшипников с 1998 года: от кольца до сборки и контроля. Поставляем на конвейеры сельхозмашиностроения и в ремонт.",
      website: "https://uralpodshipnik.example",
      phone: "+7 343 000-00-21",
      foundedYear: 1998,
      isSeller: true,
      isBuyer: true,
    },
    verified: true,
    documents: [
      ...financials(2019),
      {
        kind: "CERTIFICATE",
        title: "Сертификат соответствия ГОСТ 520-2011",
        number: "РОСС RU.0001.11МТ21",
        issuedAt: "2024-02-12",
      },
      {
        kind: "QUALITY",
        title: "Система менеджмента качества ISO 9001:2015",
        number: "ISO-9001-0421",
        issuedAt: "2023-09-01",
      },
      { kind: "QUALITY", title: "Протокол ресурсных испытаний серии 62xx", issuedAt: "2025-05-20" },
      {
        kind: "CERTIFICATE",
        title: "Декларация ЕАЭС на подшипники качения",
        number: "ЕАЭС N RU Д-RU.00021",
        issuedAt: "2025-01-15",
      },
    ],
    products: [
      {
        name: "Подшипник 180205 (6205-2RS) ГОСТ 520",
        article: "180205",
        analogs: "SKF 6205-2RSH, FAG 6205-2RSR, NSK 6205DDU, 6205-2RS",
        description:
          "Шариковый радиальный подшипник с двумя резиновыми уплотнениями, 25×52×15 мм. Ресурс подтверждён испытаниями, паспорт качества на каждую партию.",
        price: "390",
        leadTimeDays: 7,
        city: "Екатеринбург",
        status: "PUBLISHED",
      },
      {
        name: "Подшипник 180206 (6206-2RS) ГОСТ 520",
        article: "180206",
        analogs: "SKF 6206-2RSH, FAG 6206-2RSR",
        description: "Шариковый радиальный подшипник 30×62×16 мм с двусторонним уплотнением.",
        price: "460",
        leadTimeDays: 7,
        city: "Екатеринбург",
        status: "PUBLISHED",
      },
      {
        name: "Подшипник 180305 (6305-2RS) ГОСТ 520",
        article: "180305",
        analogs: "SKF 6305-2RSH, FAG 6305-2RSR",
        description: "Шариковый радиальный подшипник средней серии 25×62×17 мм.",
        price: "540",
        leadTimeDays: 10,
        city: "Екатеринбург",
        status: "PUBLISHED",
      },
    ],
    reputation: {
      completed: 58,
      cancelled: 1,
      ratings: [5, 5, 5, 5, 4, 5, 5, 5, 5, 5],
      reviews: [
        "Подшипники пришли с паспортами, отработали сезон без замечаний.",
        "Цена ниже SKF почти вдвое, ресурс сопоставимый. Берём регулярно.",
        "Отгрузили за 5 дней, хотя обещали 7.",
        "Хорошая упаковка и маркировка, приёмка прошла без вопросов.",
      ],
    },
    external: {
      facts: [
        { kind: "ok", text: "Производство подтверждено выездом: 3 цеха и 240 сотрудников" },
        { kind: "ok", text: "Арбитражных дел в роли ответчика нет с 2019 года" },
        { kind: "ok", text: "Выручка растёт четвёртый год подряд, долговая нагрузка низкая" },
      ],
    },
  },
  {
    logo: "agro.png",
    organization: {
      name: "ООО «Агродеталь-НН»",
      inn: "5200000022",
      ogrn: "1245200000022",
      city: "Нижний Новгород",
      description:
        "Молодое производство запчастей для сельхозтехники: токарные и фрезерные станки с ЧПУ, термообработка. Берём малые партии и детали по образцу.",
      phone: "+7 831 000-00-22",
      foundedYear: 2024,
      isSeller: true,
      isBuyer: true,
    },
    verified: true,
    documents: [
      ...financials(2024),
      {
        kind: "CERTIFICATE",
        title: "Декларация соответствия ТР ТС 010/2011",
        number: "ЕАЭС N RU Д-RU.00022",
        issuedAt: "2025-06-02",
      },
      { kind: "QUALITY", title: "Протокол измерений партии валов", issuedAt: "2026-04-10" },
    ],
    products: [
      {
        name: "Подшипник 6205-2RS с усиленным уплотнением",
        article: "АД-6205-2RSU",
        analogs: "SKF 6205-2RSH, 6205-2RS",
        description:
          "Сборка на отечественных кольцах, тройная кромка уплотнения для пыльных условий работы жатки.",
        price: "520",
        leadTimeDays: 12,
        city: "Нижний Новгород",
        status: "PUBLISHED",
      },
      {
        name: "Шкив вариатора мотовила",
        article: "АД-ШВ-0761",
        analogs: "Claas 0006607610",
        description: "Шкив вариатора привода мотовила, чугун СЧ20, балансировка.",
        price: "14800",
        leadTimeDays: 14,
        city: "Нижний Новгород",
        status: "PUBLISHED",
      },
    ],
    reputation: {
      completed: 7,
      cancelled: 0,
      ratings: [5],
      reviews: [
        "Сделали шкив по образцу за две недели, встал как родной.",
        "Небольшая партия, но всё чётко: созвонились, согласовали чертёж, отгрузили.",
      ],
    },
    external: {
      facts: [
        { kind: "ok", text: "Цех 600 м² и 5 станков с ЧПУ подтверждены фото- и видеоаудитом" },
        { kind: "ok", text: "Резидент технопарка, налоговая история без нарушений" },
        { kind: "warn", text: "Мощностей мало для партий больше 1 000 шт. в месяц", weight: -2 },
      ],
    },
  },
  {
    logo: "hydro.png",
    organization: {
      name: "ООО «ГидроСила»",
      inn: "6300000023",
      ogrn: "1146300000023",
      city: "Самара",
      description:
        "Гидроцилиндры, фильтры и РВД для сельхоз- и спецтехники. Собственный участок сборки и испытательный стенд.",
      phone: "+7 846 000-00-23",
      foundedYear: 2014,
      isSeller: true,
      isBuyer: true,
    },
    verified: true,
    documents: [
      ...financials(2021),
      {
        kind: "CERTIFICATE",
        title: "Декларация соответствия на гидроцилиндры",
        number: "ЕАЭС N RU Д-RU.00023",
        issuedAt: "2023-03-14",
      },
    ],
    products: [
      {
        name: "Фильтр гидравлический напорный",
        article: "ГС-ФН-0160",
        analogs: "Hydac 0160D010BN4HC, Claas 0007382910",
        description: "Фильтрующий элемент напорной линии, 10 мкм, стекловолокно.",
        price: "1900",
        leadTimeDays: 14,
        city: "Самара",
        status: "PUBLISHED",
      },
      {
        name: "Гидроцилиндр рулевой",
        article: "ГС-ЦР-50",
        analogs: "John Deere AH212345",
        description: "Гидроцилиндр рулевого управления комбайна, ход 200 мм.",
        price: "18900",
        leadTimeDays: 21,
        city: "Самара",
        status: "PUBLISHED",
      },
    ],
    reputation: {
      completed: 22,
      cancelled: 5,
      ratings: [4, 3, 4, 3, 5, 3, 4, 2, 4, 4],
      reviews: [
        "Качество нормальное, но отгрузили на две недели позже обещанного.",
        "Цилиндр рабочий, а сроки снова сорвали. Пришлось простаивать.",
        "Фильтры хорошие, по цене дешевле импорта.",
      ],
    },
    external: {
      facts: [
        { kind: "ok", text: "Участок сборки и испытательный стенд подтверждены выездом" },
        {
          kind: "bad",
          text: "3 иска о просрочке поставки за 2026 год в картотеке арбитражных дел",
        },
        { kind: "warn", text: "Отгрузки задерживаются в среднем на 12 дней" },
      ],
      flags: ["late"],
    },
  },
  {
    logo: "import.png",
    organization: {
      name: "ООО «ТД Импорт-Деталь Плюс»",
      inn: "7700000024",
      ogrn: "1257700000024",
      city: "Москва",
      legalAddress: "г. Москва, ул. Складочная, 1, стр. 1, офис 12",
      description:
        "Любые запчасти для любой техники в наличии и под заказ! Оригинал и аналоги, лучшие цены, доставка по всей России.",
      phone: "+7 495 000-00-24",
      foundedYear: 2025,
      isSeller: true,
      isBuyer: false,
    },
    verified: false,
    documents: [],
    products: [
      {
        name: "Подшипник 6205-2RS аналог SKF (в наличии)",
        article: "ИД-6205",
        analogs: "SKF 6205-2RSH, 6205-2RS",
        description: "Подшипник 6205-2RS. В наличии на складе, отгрузка за 1 день. Опт и розница.",
        price: "1290",
        leadTimeDays: 3,
        city: "Москва",
        status: "PUBLISHED",
      },
      {
        name: "Фильтр гидравлический Hydac аналог",
        article: "ИД-0160D",
        analogs: "Hydac 0160D010BN4HC",
        description: "Фильтр гидравлический, аналог Hydac. Все размеры в наличии.",
        price: "6400",
        leadTimeDays: 3,
        city: "Москва",
        status: "PUBLISHED",
      },
    ],
    reputation: {
      completed: 1,
      cancelled: 3,
      ratings: [2],
      reviews: ["Пришёл китайский подшипник без маркировки вместо заявленного аналога."],
    },
    external: {
      facts: [
        { kind: "bad", text: "Производства нет: по адресу бизнес-центр, офис 12 м²" },
        { kind: "bad", text: "Адрес массовой регистрации: там же ещё 47 компаний" },
        {
          kind: "warn",
          text: "Директор и учредитель — одно лицо, за ним 6 ликвидированных компаний",
        },
        {
          kind: "bad",
          text: "Цены — это цены импортного дистрибьютора плюс 35–40%",
        },
      ],
      flags: ["reseller"],
    },
  },
];

/** Внешние проверки для производителей, которые были в сиде раньше. */
export const existingCompanyChecks: Record<
  string,
  Partial<Omit<DemoCompany, "organization" | "products">> & {
    logo: string;
    external: ExternalChecks;
    foundedYear?: number;
  }
> = {
  "ООО Обнал": {
    logo: "obnal.png",
    verified: true,
    external: {
      facts: [
        { kind: "ok", text: "Цех металлообработки 1 200 м² подтверждён видеоаудитом" },
        { kind: "ok", text: "Арбитражных дел в роли ответчика нет" },
      ],
    },
  },
  "ООО Техмаш-Юг": {
    logo: "techmash.png",
    foundedYear: 2009,
    verified: true,
    documents: [
      ...financials(2019),
      {
        kind: "CERTIFICATE",
        title: "Декларация соответствия на РТИ",
        number: "ЕАЭС N RU Д-RU.00003",
        issuedAt: "2024-04-01",
      },
      { kind: "QUALITY", title: "Сертификат ХАССП на пищевые ингредиенты", issuedAt: "2025-02-11" },
    ],
    reputation: {
      completed: 33,
      cancelled: 1,
      ratings: [5, 5, 4, 5, 5],
      reviews: [
        "Ремни отработали весь сезон, будем брать ещё.",
        "Сегменты ножей не хуже Schumacher, а дешевле в три раза.",
        "Привезли манжеты раньше срока, документы в комплекте.",
      ],
    },
    external: {
      facts: [
        { kind: "ok", text: "Два производственных корпуса подтверждены выездом" },
        { kind: "ok", text: "Поставщик «Ростсельмаша» с 2017 года" },
        { kind: "ok", text: "Арбитражных дел в роли ответчика нет" },
      ],
    },
  },
  "АО Агрохолдинг «Заря»": {
    logo: "zarya.png",
    foundedYear: 2003,
    verified: true,
    documents: financials(2022),
    external: {
      facts: [{ kind: "ok", text: "Оплачивает поставки в срок: просрочек по оплате нет" }],
    },
  },
};
