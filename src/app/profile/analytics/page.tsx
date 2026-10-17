import type { Metadata } from "next";
import { Card, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Аналитика" };

const planned = [
  ["Спрос на ваши позиции", "Сколько раз позиции находили в поиске и открывали"],
  ["Воронка сделок", "Предложения → принятые → успешные, средний срок и сумма"],
  ["Рынок замещения", "Какие импортные узлы ищут покупатели в вашей отрасли"],
  ["Репутация", "Динамика рейтинга и сравнение с похожими предприятиями"],
] as const;

export default function Page() {
  return (
    <Section title="Аналитика">
      <p className="text-gray-600">
        Раздел готовится. Здесь будут отчёты по данным платформы, например:
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {planned.map(([title, text]) => (
          <Card key={title} className="border-dashed">
            <p className="text-lg font-bold">{title}</p>
            <p className="text-gray-600">{text}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
