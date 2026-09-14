"use client";

import ErrorState from "@/components/ErrorState";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      title="Unable to load the docket"
      body="The claim list could not be retrieved from the contract."
      onRetry={reset}
    />
  );
}
