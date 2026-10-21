"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { placeOrder } from "@/app/orders/new/actions";
import { FileDrop } from "./FileDrop";
import {
  Field,
  FormMessage,
  SubmitButton,
  TextArea,
  buttonClass,
  secondaryButtonClass,
} from "./form";
import { initialFormState } from "./form-state";
import { routes } from "./navigation";
import { Question, REPLACEMENT_QUESTIONS, ReplacementQuestions } from "./OrderQuestionnaire";

export type SearchViewer = { name: string; email: string } | null;

/** Черновик опросника: переживает вход в аккаунт и случайное закрытие вкладки. */
const DRAFT_KEY = "artel:search-draft";
const REOPEN_KEY = "artel:search-draft:reopen";

function readDraft(): Record<string, string[]> | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : null;
  } catch {
    return null;
  }
}

function saveDraft(form: HTMLFormElement) {
  const draft: Record<string, string[]> = {};
  for (const [key, value] of new FormData(form)) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) (draft[key] ??= []).push(value);
  }
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Хранилище недоступно (приватный режим) — просто без черновика.
  }
}

function restoreDraft(form: HTMLFormElement, draft: Record<string, string[]>) {
  for (const element of form.elements) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) continue;
    const values = draft[element.name];
    if (!values || element.type === "file" || element.type === "hidden") continue;
    if (
      element instanceof HTMLInputElement &&
      (element.type === "radio" || element.type === "checkbox")
    ) {
      element.checked = values.includes(element.value);
    } else {
      element.value = values[0] ?? "";
    }
  }
}

/**
 * Панель под строкой поиска, которая открывается по «+»: сверху документы (ТЗ, чертежи,
 * фото образца), ниже — опросник для подробного запроса. Из неё можно искать с учётом
 * артикула оригинала или сразу разместить заказ на рынке: это тот же заказ, что и на
 * странице «Размещение карточки на заказ» (`placeOrder`), с теми же файлами и полями.
 */
export function SearchDetails({
  open,
  query,
  onQueryChange,
  onClose,
  onReopen,
  viewer,
}: {
  open: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onClose: () => void;
  onReopen: () => void;
  viewer: SearchViewer;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const questionsRef = useRef<HTMLDivElement>(null);
  const [state, action] = useActionState(placeOrder, initialFormState);
  const v: Record<string, string | undefined> = state.values ?? {
    contactName: viewer?.name,
    contactEmail: viewer?.email,
    unit: "шт.",
  };

  // Вернулись после входа — открываем панель с тем, что уже заполнили.
  useEffect(() => {
    const draft = readDraft();
    if (!draft || !formRef.current) return;
    restoreDraft(formRef.current, draft);
    if (draft.title?.[0]) onQueryChange(draft.title[0]);
    try {
      if (sessionStorage.getItem(REOPEN_KEY)) {
        sessionStorage.removeItem(REOPEN_KEY);
        onReopen();
      }
    } catch {}
    // Только при первом показе.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function searchWithDetails() {
    const form = formRef.current;
    const extra = form
      ? ["originalBrand", "originalArticle"].map((name) =>
          String(new FormData(form).get(name) ?? ""),
        )
      : [];
    const q = [query, ...extra]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ");
    onClose();
    router.push(q ? `${routes.search}?q=${encodeURIComponent(q)}` : routes.search);
  }

  return (
    <div
      id="search-details"
      data-open={open || undefined}
      inert={!open}
      className="group mt-[calc(var(--u)*24)] grid -translate-y-4 scale-[0.98] grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity,translate,scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-open:translate-y-0 data-open:scale-100 data-open:grid-rows-[1fr] data-open:opacity-100 motion-reduce:transition-none max-md:mt-3"
    >
      <div className="min-h-0 overflow-clip rounded-[calc(var(--u)*50)] bg-white shadow-[0_24px_80px_-20px_rgba(23,55,128,0.35)] ring-1 ring-black/5 max-md:rounded-3xl">
        <form
          ref={formRef}
          action={action}
          onInput={(e) => saveDraft(e.currentTarget)}
          onSubmit={() => {
            // Заказ уходит: черновик больше не нужен (при ошибке поля вернёт сама форма).
            try {
              sessionStorage.removeItem(DRAFT_KEY);
            } catch {}
          }}
          className="flex flex-col"
        >
          <div className="flex items-start justify-between gap-4 px-6 pt-6 md:px-10 md:pt-8">
            <div>
              <h2 className="text-brand-dark text-2xl font-extrabold md:text-3xl">
                Подробный запрос
              </h2>
              <p className="text-gray-600">
                Приложите документы и ответьте на вопросы — производитель поймёт задачу без
                переписки.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-2xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              ×
            </button>
          </div>

          <Stage delay="delay-75">
            <h3 className="text-xl font-extrabold text-gray-900">Документы</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FileDrop
                name="specFiles"
                title="Техническое задание"
                hint="PDF, Word, Excel"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.odt,.ods,.txt,.rtf"
              />
              <FileDrop
                name="techFiles"
                title="Чертежи, схемы, фото образца"
                hint="PDF, DWG, изображения"
              />
            </div>
            <p className="text-sm text-gray-500">
              Все файлы вместе — до 4 МБ. Их увидят только предприятия, вошедшие на платформу.
            </p>
            <button
              type="button"
              onClick={() =>
                questionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="text-brand flex cursor-pointer items-center gap-2 self-center font-bold hover:opacity-80"
            >
              Ниже — опросник, по нему подберём точнее
              <span aria-hidden className="animate-bounce">
                ↓
              </span>
            </button>
          </Stage>

          <div ref={questionsRef} className="scroll-mt-4">
            <Stage delay="delay-150">
              <h3 className="text-xl font-extrabold text-gray-900">Опишите запрос</h3>
              <Question n={1} title="Что ищем?">
                <Field
                  label="Название позиции"
                  name="title"
                  required
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder="Подшипник 6205-2RS для комбайна"
                  state={state}
                />
              </Question>
              <ReplacementQuestions v={v} state={state} start={2} />
              <Question n={2 + REPLACEMENT_QUESTIONS} title="Характеристики и требования">
                <TextArea
                  label="Размеры, материалы, допуски, стандарты"
                  name="specification"
                  rows={4}
                  placeholder="25×52×15 мм, уплотнение 2RS, класс точности 0 по ГОСТ 520-2011"
                  defaultValue={v.specification}
                  state={state}
                />
              </Question>
              <Question n={3 + REPLACEMENT_QUESTIONS} title="Сколько, куда и когда?">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_110px_1fr]">
                  <Field
                    label="Количество"
                    name="quantity"
                    type="number"
                    min={1}
                    defaultValue={v.quantity}
                    state={state}
                  />
                  <Field label="Ед." name="unit" defaultValue={v.unit ?? "шт."} state={state} />
                  <Field
                    label="Бюджет, ₽"
                    name="budget"
                    inputMode="decimal"
                    placeholder="по договорённости"
                    defaultValue={v.budget}
                    state={state}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Нужно к дате"
                    name="deadline"
                    type="date"
                    defaultValue={v.deadline}
                    state={state}
                  />
                  <Field label="Город поставки" name="city" defaultValue={v.city} state={state} />
                </div>
              </Question>
              <Question
                n={4 + REPLACEMENT_QUESTIONS}
                title="Что ещё важно?"
                hint="Можно не заполнять: соберём описание из ответов выше"
              >
                <TextArea
                  label="Комментарий"
                  name="description"
                  rows={3}
                  placeholder="Сейчас стоит оригинал, поставки прекратились; нужна партия к посевной"
                  defaultValue={v.description}
                  state={state}
                />
              </Question>
              <Question n={5 + REPLACEMENT_QUESTIONS} title="Как с вами связаться?">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field
                    label="Контактное лицо"
                    name="contactName"
                    required
                    defaultValue={v.contactName}
                    state={state}
                  />
                  <Field
                    label="Телефон"
                    name="contactPhone"
                    type="tel"
                    defaultValue={v.contactPhone}
                    state={state}
                  />
                  <Field
                    label="Email"
                    name="contactEmail"
                    type="email"
                    defaultValue={v.contactEmail}
                    state={state}
                  />
                </div>
              </Question>
            </Stage>
          </div>

          <div className="bottom-0 mt-auto flex flex-col gap-3 border-t border-gray-100 bg-white/95 px-6 py-4 backdrop-blur md:sticky md:px-10">
            <FormMessage state={state} />
            <div className="flex flex-wrap items-center gap-3">
              {viewer ? (
                <SubmitButton pendingText="Размещаем…">Разместить заказ</SubmitButton>
              ) : (
                <Link
                  href={`${routes.login}?next=${encodeURIComponent(routes.home)}`}
                  onClick={() => {
                    if (formRef.current) saveDraft(formRef.current);
                    try {
                      sessionStorage.setItem(REOPEN_KEY, "1");
                    } catch {}
                  }}
                  className={buttonClass}
                >
                  Войти и разместить заказ
                </Link>
              )}
              <button type="button" onClick={searchWithDetails} className={secondaryButtonClass}>
                Найти с учётом артикула
              </button>
              <p className="text-sm text-gray-500">
                {viewer
                  ? "Заказ увидят производители в режиме «Продавцам»."
                  : "Ответы сохранятся, файлы после входа нужно будет прикрепить заново."}
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Блок панели, который проявляется чуть позже самой панели. */
function Stage({ delay, children }: { delay: string; children: ReactNode }) {
  return (
    <section
      className={`flex translate-y-3 flex-col gap-5 px-6 py-6 opacity-0 transition-[opacity,translate] duration-500 ease-out group-data-open:translate-y-0 group-data-open:opacity-100 motion-reduce:transition-none md:px-10 ${delay}`}
    >
      {children}
    </section>
  );
}
