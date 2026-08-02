/**
 * 서버·클라이언트 양쪽에서 쓰는 순수 로직만 둔다.
 * DB 조회는 lib/people.server.ts (next/headers 의존 → 서버 전용).
 */

export type PersonKind = "senior" | "team";

export type Person = {
  id: string;
  kind: PersonKind;
  name: string;
  role: string;
  region: string | null;
  tagline: string;
  bio: string;
  quote: string | null;
  photo_path: string | null;
  photo_alt: string;
  tags: string[];
  sort: number;
  // 비어 있으면 한국어로 떨어진다 (lib/i18n.ts의 pick)
  role_en: string;
  region_en: string;
  tagline_en: string;
  bio_en: string;
  quote_en: string;
};

export type AdminPerson = Person & {
  is_published: boolean;
  consent_at: string | null;
  consent_memo: string;
  created_at: string;
};

export const PERSON_PUBLIC_COLS =
  "id, kind, name, role, region, tagline, bio, quote, photo_path, photo_alt, tags, sort, role_en, region_en, tagline_en, bio_en, quote_en";

export const PERSON_ADMIN_COLS = `${PERSON_PUBLIC_COLS}, is_published, consent_at, consent_memo, created_at`;

/**
 * Storage public URL.
 * 업로드 경로에 타임스탬프가 들어 있어 사진을 바꾸면 URL 자체가 바뀐다 —
 * Next 16의 images.minimumCacheTTL 기본 4시간을 우회하는 가장 단순한 방법이다.
 */
export function photoUrl(path: string | null): string | null {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/${path}`;
}

export const KIND_LABEL: Record<PersonKind, string> = {
  senior: "시니어 호스트",
  team: "팀원",
};
