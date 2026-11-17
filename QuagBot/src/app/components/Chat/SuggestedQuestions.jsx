const DEFAULT_QUESTIONS = [
  'What caused the American Revolution?',
  'Who was George Washington?',
  'Why was the Boston Tea Party important?',
  'What happened at the Battle of Yorktown?',
];

function SuggestedQuestions({
  onSelect,
  disabled = false,
  questions = DEFAULT_QUESTIONS,
}) {
  return (
    <section aria-label="Suggested questions" className="w-full max-w-2xl self-center py-space-4">
      <h2 className="text-base font-semibold text-text">Suggested questions</h2>
      <p className="mt-space-1 text-sm text-text-muted">
        Choose a question to start learning about the American Revolution.
      </p>
      <div className="mt-space-3 grid grid-cols-1 gap-space-2 sm:grid-cols-2">
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onSelect(question)}
            disabled={disabled}
            className="cursor-pointer rounded-card border border-border bg-surface px-space-4 py-space-3 text-left text-sm text-text transition-colors enabled:hover:border-accent enabled:hover:bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>
    </section>
  );
}

export default SuggestedQuestions;
