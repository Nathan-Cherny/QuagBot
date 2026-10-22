export const pageTitle =
  "mb-space-5 text-center text-[2rem] font-medium tracking-[-1.68px] text-text";

export const sidebarTitle =
  "mb-space-3 text-[0.8rem] leading-[118%] font-semibold tracking-[-0.24px] text-text-muted";

// --- Card + rows (profile, log in, sign up) ---------------------------------

export const card =
  "flex flex-col overflow-hidden rounded-card border border-border bg-surface";

export const cardRow =
  "flex items-center justify-between gap-space-3 border-t border-border px-space-5 py-space-3 first:border-t-0";

// A row that contains an input: clicking anywhere on it should focus the input.
export const cardRowInput = `${cardRow} cursor-text`;

export const rowLabel = "text-[0.82rem] text-text-muted";

// Adds the red asterisk to a required field's label.
export const required = "after:text-[red] after:content-['_*']";

export const rowValue = "text-right text-[0.9rem] text-text";

export const rowValueConnect = `${rowValue} flex items-center gap-space-2 tracking-[0.05em]`;

export const iconButton =
  "flex cursor-pointer items-center justify-center border-none bg-transparent p-[2px] text-text-muted hover:text-text";

// --- Buttons -----------------------------------------------------------------

const buttonBase =
  "flex cursor-pointer items-center justify-center gap-space-2 rounded-card border px-space-4 py-space-2 text-[0.88rem]";

export const buttonStack = "mt-space-4 flex flex-col gap-space-2";

export const button = `${buttonBase} border-border bg-surface text-text hover:bg-bg`;

export const buttonDanger = `${buttonBase} border-danger-border bg-surface text-danger hover:bg-danger-bg`;

export const buttonPrimary = `${buttonBase} border-accent bg-accent font-medium text-accent-contrast hover:brightness-95`;

// --- Form inputs -------------------------------------------------------------

export const authInput =
  "min-w-0 max-w-[260px] flex-1 rounded-card border border-border bg-bg px-space-3 py-space-2 text-right text-[0.9rem] text-text focus:outline-2 focus:outline-offset-1 focus:outline-accent";

export const authInputWrap = "flex flex-1 items-center justify-end gap-space-2";

export const authError = "mt-2 text-[0.9rem] text-error";

export const authNotice = "mt-2 text-[0.9rem]";

export const authSwitch =
  "mt-space-4 text-center text-[0.85rem] text-text-muted";

export const authLink = "text-accent";

// --- Chat --------------------------------------------------------------------

export const chatMessageRow = "flex items-end gap-space-2";

export const chatAvatar =
  "size-[32px] shrink-0 rounded-full bg-quagbot-bubble object-cover";
