/** Результат Server Action для формы: общее сообщение и ошибки по полям. */
export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Что ввёл пользователь: после ошибки React сбрасывает форму, и поля заполняются заново. */
  values?: Record<string, string>;
};

export const initialFormState: FormState = {};
