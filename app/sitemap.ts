import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/origin";
import { getFormsFor } from "@/lib/forms.server";

export const dynamic = "force-dynamic";

const STATIC: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, freq: "daily" },
  { path: "/about", priority: 0.8, freq: "monthly" },
  { path: "/people", priority: 0.8, freq: "weekly" },
  { path: "/notice", priority: 0.9, freq: "daily" },
  { path: "/faq", priority: 0.6, freq: "monthly" },
  { path: "/apply", priority: 0.9, freq: "weekly" },
  { path: "/privacy", priority: 0.3, freq: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const SITE = await getSiteOrigin();

  // 클래스 상세는 데이터로 늘어난다 — 목록을 코드에 박지 않는다
  const classes = await getFormsFor("guest");

  let notices: { id: string; updated_at: string }[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("notices")
      .select("id, updated_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    notices = data ?? [];
  } catch {
    notices = [];
  }

  return [
    ...STATIC.map((s) => ({
      url: `${SITE}${s.path}`,
      lastModified: now,
      changeFrequency: s.freq,
      priority: s.priority,
    })),
    ...classes.map((c) => ({
      url: `${SITE}/about/${c.key}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...notices.map((n) => ({
      url: `${SITE}/notice/${n.id}`,
      lastModified: new Date(n.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
