import { useAltoVisual } from '../hooks/useAltoVisual.js';

export default function FondoAuth() {
  useAltoVisual();

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-login-backdrop" />
      <div className="animate-auth-blob-a absolute -top-24 left-[8%] h-[28rem] w-[28rem] rounded-full bg-primary-container/15 blur-3xl motion-reduce:animate-none" />
      <div className="animate-auth-blob-b absolute top-[38%] -right-28 h-[24rem] w-[24rem] rounded-full bg-login-active/15 blur-3xl motion-reduce:animate-none" />
      <div className="animate-auth-blob-c absolute -bottom-28 left-[28%] h-[22rem] w-[22rem] rounded-full bg-primary-container/10 blur-3xl motion-reduce:animate-none" />
    </div>
  );
}
