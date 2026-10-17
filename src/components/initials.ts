const legalForms = /^(ООО|ОАО|ЗАО|ПАО|АО|ИП|НПО|ФГУП|МУП|LLC|LTD)$/i;

/** Две буквы для аватара: «ООО «Агро Маш»» → «АМ». Организационно-правовая форма пропускается. */
export function initials(name: string): string {
  const words = name
    .replace(/[«»"'.,]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !legalForms.test(word));
  if (words.length === 0) return name.trim().slice(0, 2).toUpperCase();
  const letters = words.length > 1 ? words[0]![0]! + words[1]![0]! : words[0]!.slice(0, 2);
  return letters.toUpperCase();
}
