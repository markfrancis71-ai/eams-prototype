import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-full" data-testid="not-found">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-muted-foreground mb-2">404 — Not Found</h1>
        <p className="text-sm text-muted-foreground mb-4">The page you're looking for doesn't exist.</p>
        <Link href="/" className="text-sm text-primary hover:underline">
          Go to Domains
        </Link>
      </div>
    </div>
  );
}
