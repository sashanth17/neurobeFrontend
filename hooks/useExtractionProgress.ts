import { useState, useEffect } from 'react';
import { MarkExtractionService } from '@/services/markExtraction.service';

export function useExtractionProgress(jobId: number | null, onComplete?: () => void) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('PENDING');
  const [processedPages, setProcessedPages] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!jobId || status === 'COMPLETED' || status === 'FAILED') return;

    const interval = setInterval(async () => {
      try {
        const data = await MarkExtractionService.pollExtractionStatus(jobId);
        setProgress(data.progress_pct);
        setStatus(data.status);
        setProcessedPages(data.processed_pages);
        setTotalPages(data.total_pages);

        if (data.status === 'COMPLETED') {
          clearInterval(interval);
          onComplete?.();
        } else if (data.status === 'FAILED') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [jobId, status, onComplete]);

  return { progress, status, processedPages, totalPages };
}
