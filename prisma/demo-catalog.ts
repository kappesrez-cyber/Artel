// Демо-каталог: позиции, на которых видно, как работает поиск. Его использует сид
// (`npm run db:seed`) и тест поиска на реальных запросах (`src/server/catalog/search.db.test.ts`).

export type DemoProduct = {
  name: string;
  article?: string;
  analogs?: string;
  description?: string;
  price: string;
  leadTimeDays: number;
  city: string;
  status: "PUBLISHED" | "DRAFT";
  /** Снимки из `prisma/demo-photos`, первый — главный. */
  photos?: string[];
};

/** Позиции «ООО «МеталлАгро» (Воронеж), демо-продавца: металлообработка для сельхозтехники. */
export const demoSellerProducts: DemoProduct[] = [
  {
    name: "Подшипник шариковый радиальный 6205-2RS",
    article: "ПШ-6205-2RS",
    analogs: "SKF 6205-2RSH, FAG 6205-2RSR, NSK 6205DDU",
    description:
      "Закрытый подшипник с двусторонним резиновым уплотнением. 25×52×15 мм, класс точности 0 по ГОСТ 520-2011. Для приводов жаток и транспортёров комбайнов.",
    price: "450",
    leadTimeDays: 14,
    city: "Воронеж",
    status: "PUBLISHED",
  },
  {
    name: "Вал приводной жатки",
    article: "ВЖ-760",
    analogs: "Claas 0006345870",
    description:
      "Вал привода мотовила для жаток комбайнов Claas Lexion 760. Сталь 40Х, закалка ТВЧ.",
    price: "38500",
    leadTimeDays: 21,
    city: "Воронеж",
    status: "PUBLISHED",
  },
  {
    name: "Цепь приводная роликовая ПР-25,4",
    article: "ПР-25.4-6000",
    analogs: "Rexnord 16B-1, Tsubaki RS80",
    description: "Однорядная роликовая цепь шаг 25,4 мм для транспортёров и элеваторов.",
    price: "5200",
    leadTimeDays: 10,
    city: "Воронеж",
    status: "PUBLISHED",
  },
  {
    name: "Гидроцилиндр подъёма жатки",
    article: "ГЦ-80.40.400",
    analogs: "Claas 0007563440",
    description: "Гидроцилиндр двустороннего действия, ход 400 мм, давление до 20 МПа.",
    price: "27000",
    leadTimeDays: 30,
    city: "Воронеж",
    status: "DRAFT",
  },
];

/** Позиции «ООО Техмаш-Юг» (Ростов-на-Дону): РТИ, ремни, ножи и пищевые ингредиенты. */
export const techmashProducts: DemoProduct[] = [
  {
    name: "Манжета армированная 45×65×10",
    article: "1.2-45×65-10",
    analogs: "Corteco 12011234B, Elring 45x65x10",
    description:
      "Резиновая армированная манжета для валов, сальник ступицы и редуктора. Резина NBR, ГОСТ 8752-79.",
    price: "120",
    leadTimeDays: 5,
    city: "Ростов-на-Дону",
    status: "PUBLISHED",
  },
  {
    name: "Ремень приводной клиновой SPB 2000",
    article: "SPB-2000",
    analogs: "Gates SPB2000, Optibelt SK SPB 2000",
    description: "Узкий клиновой ремень для приводов молотилки и вентилятора очистки.",
    price: "1650",
    leadTimeDays: 7,
    city: "Ростов-на-Дону",
    status: "PUBLISHED",
  },
  {
    name: "Сегмент ножа жатки",
    article: "СН-81018",
    analogs: "Schumacher 81018, John Deere H213333",
    description: "Сегмент режущего аппарата с насечкой, сталь 65Г, закалка.",
    price: "95",
    leadTimeDays: 7,
    city: "Ростов-на-Дону",
    status: "PUBLISHED",
  },
  {
    name: "Фильтр гидравлический",
    article: "ФГ-0007382910",
    analogs: "Claas 0007382910, Hydac 0160D010BN4HC",
    description: "Фильтрующий элемент гидросистемы комбайна, тонкость фильтрации 10 мкм.",
    price: "2100",
    leadTimeDays: 10,
    city: "Ростов-на-Дону",
    status: "PUBLISHED",
  },
  {
    name: "Амилаза грибковая для хлебопечения",
    article: "АМГ-10000",
    analogs: "Novozymes Fungamyl 2500 SG",
    description:
      "Ферментный препарат для улучшения хлеба: активность 10 000 ед./г, сертификат ХАССП, упаковка 25 кг.",
    price: "2900",
    leadTimeDays: 14,
    city: "Ростов-на-Дону",
    status: "PUBLISHED",
    photos: ["amylase.jpg"],
  },
];
