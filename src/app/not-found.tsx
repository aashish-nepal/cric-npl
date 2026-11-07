import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The page you are looking for may have moved, or the match, player or article does not exist.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className={buttonVariants({ variant: "default" })}>
          Back to home
        </Link>
        <Link href="/live" className={buttonVariants({ variant: "outline" })}>
          Live scores
        </Link>
      </div>
    </div>
  );
}
