import Link from "next/link";
import { Save } from "lucide-react";
import type { NewsArticle, NewsCategory } from "@/types/content";
import { saveArticleAction } from "@/app/actions/admin";
import { SubmitButton } from "./submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { buttonVariants } from "@/components/ui/button";

export function ArticleForm({
  article,
  categories,
}: {
  article?: NewsArticle;
  categories: NewsCategory[];
}) {
  return (
    <form action={saveArticleAction} className="grid gap-5 xl:grid-cols-[1fr_320px]">
      {article ? <input type="hidden" name="articleId" value={article.id} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>{article ? "Article content" : "New article"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <Label htmlFor="title">Headline</Label>
            <Input id="title" name="title" required minLength={5} maxLength={200} defaultValue={article?.title} />
          </Field>
          <Field>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              maxLength={200}
              defaultValue={article?.slug}
              placeholder="generated-from-headline"
            />
            <p className="text-[11px] text-muted-foreground">Leave blank to generate a slug from the headline.</p>
          </Field>
          <Field>
            <Label htmlFor="excerpt">Summary</Label>
            <Textarea
              id="excerpt"
              name="excerpt"
              required
              minLength={20}
              maxLength={400}
              rows={2}
              defaultValue={article?.excerpt}
              className="min-h-16"
            />
          </Field>
          <Field>
            <Label htmlFor="body">Body (Markdown subset)</Label>
            <Textarea
              id="body"
              name="body"
              required
              minLength={100}
              maxLength={60000}
              rows={20}
              defaultValue={article?.body}
              className="min-h-[420px] font-mono text-[12.5px] leading-6"
              placeholder={"## Section heading\n\nParagraph text. Use **bold**, *italic*, lists, blockquotes and links."}
            />
            <p className="text-[11px] text-muted-foreground">
              Supported: headings, paragraphs, lists, bold, italic, links, blockquotes and horizontal rules. Raw HTML is escaped.
            </p>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <Label htmlFor="seoTitle">SEO title</Label>
              <Input id="seoTitle" name="seoTitle" maxLength={200} defaultValue={article?.seoTitle ?? ""} />
            </Field>
            <Field>
              <Label htmlFor="metaDescription">Meta description</Label>
              <Input id="metaDescription" name="metaDescription" maxLength={400} defaultValue={article?.metaDescription ?? ""} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Publishing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field>
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={article?.status ?? "draft"}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Select>
            </Field>
            <Field>
              <Label htmlFor="categoryId">Category</Label>
              <Select id="categoryId" name="categoryId" required defaultValue={article?.categoryId ?? categories[0]?.id ?? ""}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" name="tags" defaultValue={article?.tags.join(", ")} placeholder="match report, kathmandu" />
              <p className="text-[11px] text-muted-foreground">Comma separated, up to 12.</p>
            </Field>
            <label className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-2.5 text-xs">
              <input type="checkbox" name="featured" defaultChecked={article?.featured} className="mt-0.5 h-4 w-4 accent-primary" />
              <span>
                <span className="block font-semibold">Feature on homepage</span>
                <span className="text-muted-foreground">Eligible for the lead story slot.</span>
              </span>
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              <SubmitButton size="sm" pendingLabel="Saving…">
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                {article ? "Save article" : "Create article"}
              </SubmitButton>
              <Link href="/admin/news" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Cancel
              </Link>
            </div>
            {article?.status === "published" ? (
              <Link href={`/news/${article.slug}`} className="block text-[11px] font-semibold text-primary hover:underline">
                View published article →
              </Link>
            ) : null}
          </CardContent>
        </Card>

        <div className="rounded-lg border border-border bg-surface p-3 text-[11px] leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">Editorial standards</p>
          <p className="mt-1">
            Publish verified information only. Do not invent quotes, statistics or match outcomes. Drafts and scheduled posts stay
            off public routes until published.
          </p>
        </div>
      </aside>
    </form>
  );
}
