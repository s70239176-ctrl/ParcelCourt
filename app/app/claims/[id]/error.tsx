"use client";

import ErrorState from "@/components/ErrorState";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      title="Unable to load case"
      body="The case record could not be retrieved."
      onRetry={reset}
    />
  );
}
