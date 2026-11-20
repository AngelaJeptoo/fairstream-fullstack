'use client';
import { useEffect, useRef } from 'react';

const ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleButton({ onCredential }) {
  const box = useRef(null), cb = useRef(onCredential);
  cb.current = onCredential;
  useEffect(() => {
    if (!ID) return;
    const init = () => {
      window.google.accounts.id.initialize({ client_id: ID, callback: r => cb.current(r.credential) });
      window.google.accounts.id.renderButton(box.current, { theme: 'filled_black', size: 'large', text: 'continue_with', shape: 'pill', width: 320 });
    };
    if (window.google?.accounts) return init();
    const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = init; document.body.appendChild(s);
  }, []);
  if (!ID) return <p className="text-center text-xs text-mute">The "Continue with Google" button appears here once NEXT_PUBLIC_GOOGLE_CLIENT_ID is set.</p>;
  return <div ref={box} className="flex justify-center" />;
}
