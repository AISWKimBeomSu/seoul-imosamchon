import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getForms } from "@/lib/forms.server";
import type { ApplyForm } from "@/lib/forms";
import type { Person } from "@/lib/people";

/**
 * 체험↔호스트 연결 조회 (form_hosts).
 *
 * 0020 적용 전에는 테이블이 없어 빈 결과로 떨어진다. 그때는 상세 페이지의
 * 호스트 블록이 안 보일 뿐 페이지는 멀쩡하다.
 */
type Link = { form_key: string; person_id: string; sort: number };

const getLinks = cache(async (): Promise<Link[]> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("form_hosts")
      .select("form_key, person_id, sort")
      .order("sort", { ascending: true });
    if (error) return [];
    return (data ?? []) as Link[];
  } catch {
    return [];
  }
});

/** 이 체험을 진행하는 사람들. people 쪽 공개 여부가 최종 필터다. */
export async function getFormHosts(
  formKey: string,
  people: Person[],
): Promise<Person[]> {
  const links = await getLinks();
  const ids = links.filter((l) => l.form_key === formKey).map((l) => l.person_id);
  if (ids.length === 0) return [];
  // links의 순서(sort)를 유지한다 — 대표 호스트가 먼저 나와야 한다.
  return ids
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => Boolean(p));
}

/** 이 사람이 진행하는 체험들 */
export async function getHostForms(personId: string): Promise<ApplyForm[]> {
  const [links, forms] = await Promise.all([getLinks(), getForms()]);
  const keys = new Set(
    links.filter((l) => l.person_id === personId).map((l) => l.form_key),
  );
  return forms.filter((f) => keys.has(f.key));
}
