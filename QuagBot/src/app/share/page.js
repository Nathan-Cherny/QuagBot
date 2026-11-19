import PublicChat from './PublicChat';

export const metadata = {
  title: 'Shared conversation · QuagBot',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function SharePage() {
  return <PublicChat />;
}
