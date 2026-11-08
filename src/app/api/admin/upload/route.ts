import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

/**
 * Authenticated editorial image upload.
 *
 * Validation happens on the server: MIME type, size and permission. In demo mode
 * (no Supabase project) the route returns a clear 503 instead of silently storing
 * an image that cannot be served in production.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!can(session.role, "news.manage")) return NextResponse.json({ error: "Not permitted." }, { status: 403 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  const extension = ALLOWED.get(file.type);
  if (!extension) return NextResponse.json({ error: "Use a JPEG, PNG, WebP or AVIF image." }, { status: 415 });
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Images must be between 1 byte and 5 MB." }, { status: 413 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Image uploads need Supabase Storage. In demo mode, paste an image URL instead." },
      { status: 503 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const path = `articles/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  const client = getSupabaseAdminClient();
  const upload = await client.storage.from("media").upload(path, bytes, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (upload.error) {
    return NextResponse.json({ error: `Upload failed: ${upload.error.message}` }, { status: 500 });
  }

  const publicUrl = client.storage.from("media").getPublicUrl(path).data.publicUrl;
  await client.from("media_assets").insert({
    bucket: "media",
    path,
    url: publicUrl,
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_by: session.id,
  });

  return NextResponse.json({ url: publicUrl });
}
