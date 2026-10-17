// Подписи перечислений из схемы базы для интерфейса.

export const documentKindLabels = {
  REGISTRATION: "Регистрационные документы",
  CERTIFICATE: "Сертификаты и декларации",
  LICENSE: "Лицензии и разрешения",
  FINANCIAL_REPORT: "Финансовая отчётность",
  QUALITY: "Качество и испытания",
  OTHER: "Прочее",
} as const;

export const productStatusLabels = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликована",
  ARCHIVED: "В архиве",
} as const;

export const dealStatusLabels = {
  REQUESTED: "Ждёт ответа продавца",
  ACCEPTED: "В работе",
  COMPLETED: "Успешно завершена",
  CANCELLED: "Отменена",
} as const;

export const dealActionLabels = {
  accept: "Принять",
  complete: "Подтвердить получение",
  cancel: "Отменить",
} as const;

/** «5 сделок», «1 отзыв», «3 позиции». */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? one
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? few
        : many;
  return `${n} ${word}`;
}
