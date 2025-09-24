import { SubmissionForm } from '@/components/submission-form';

export default function SubmitPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Submit Inspiration</h1>
        <p className="text-muted-foreground">
          Share your amazing design discoveries with the community. 
          All submissions are reviewed before being featured.
        </p>
      </div>
      
      <SubmissionForm />
    </div>
  );
}