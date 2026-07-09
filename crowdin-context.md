# Translation context — Algorea Frontend

This context applies to **every string** in this file. Algorea extracts all of
its UI text into a single `messages.xlf`, so the notes below describe the whole
application rather than a specific screen or module. For guidance about an
individual string, rely on its own `meaning|description` note (Angular `i18n`
metadata) in addition to this file-level context.

## Product

Algorea is an **educational platform** used by students, teachers, and group
administrators to browse activities and skills, solve interactive tasks
(including Bebras-style programming/algorithmic exercises), track progress, and
manage groups and permissions. Strings appear in a web application UI: menus,
buttons, form labels, table headers, tooltips, dialogs, validation messages,
and notifications.

## Audience & register

- Audience: learners (including children and teenagers), educators, and
  administrators.
- Tone: clear, neutral, and encouraging; polite but not overly formal.
- Use the register conventionally expected for educational software UIs in the
  target language (e.g. in French prefer the formal "vous"; in German use the
  formal "Sie") unless a string's own note says otherwise.
- Keep the language inclusive and accessible; avoid idioms, slang, and cultural
  references that may not translate well.

## Terminology

- Keep product/domain terms consistent across the whole app. Key recurring
  concepts include: **activity**, **skill**, **task**, **item**, **group**,
  **participant**, **permission**, **answer**, **score**, **thread**.
- Do **not** translate the product name "Algorea".
- Reuse existing glossary/translation-memory entries when available to keep
  wording consistent between screens.

## Constraints

- UI space is limited: prefer concise translations, especially for buttons,
  menu items, and table headers.
- Preserve any placeholders/interpolations and ICU plural/select constructs
  exactly as they appear (e.g. `{{ value }}`, `{count, plural, ...}`); only
  translate the surrounding text.
- Keep leading/trailing whitespace and punctuation consistent with the source.
- Preserve HTML tags and their attributes; translate only the visible text.
- Target languages: French (fr), German (de), and Italian (it); source is
  English (en).
- In case of doubt, also check the French translation, which is the
  most-reviewed one and can serve as a reference for the intended meaning.
