function UserAvatar({ className = '' }) {
  return (
    <svg
      className={`user-avatar ${className}`.trim()}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="12" fill="var(--color-border)" />
      <circle cx="12" cy="9.5" r="3.5" fill="var(--color-text-muted)" />
      <path d="M4.5 20.5c1.2-3.6 4.2-5.6 7.5-5.6s6.3 2 7.5 5.6" fill="var(--color-text-muted)" />
    </svg>
  );
}

export default UserAvatar;
