'use client';

import { useState } from 'react';
import { cn, copyToClipboard, getPollShareUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ShareButtonProps {
  pollId: string;
  className?: string;
}

export function ShareButton({ pollId, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = getPollShareUrl(pollId);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Participez à ce sondage Nutanix !', url });
        return;
      } catch { /* continue with copy */ }
    }

    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Impossible de copier le lien');
    }
  };

  return (
    <button
      onClick={handleShare}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-charcoal-200 text-charcoal-700',
        'hover:border-primary-500 hover:text-primary-500 transition-all duration-200',
        className
      )}
    >
      {copied ? (
        <>
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Copié !</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Partager</span>
        </>
      )}
    </button>
  );
}

export default ShareButton;
