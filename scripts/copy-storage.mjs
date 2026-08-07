#!/usr/bin/env node
/**
 * 구 Supabase의 files 버킷 객체를 신규 프로젝트로 옮긴다. (v2.0 §16-3)
 *
 * 구 버킷은 public=true라 읽기는 공개 URL로 되지만, 쓰기는 service_role이
 * 필요하다. 그 키를 코드나 대화에 남기지 않으려고 환경변수로만 받는다.
 *
 * 실행:
 *   SUPABASE_SERVICE_ROLE_KEY='새 프로젝트의 service_role 키' node scripts/copy-storage.mjs
 *
 * 두 번 돌려도 안전하다(upsert). 옮길 게 없으면 아무것도 안 한다.
 */

const OLD_REF = "pxfmvncfdfiuxobjzihw"; // 친구 팀이 쓰던 기존 프로젝트 (읽기만 한다)
const NEW_REF = "zurjjkznmdqxtzqbzejp"; // seoul-imosamchon-v2
const BUCKET = "files";

// 구 DB의 storage.objects에서 확인한 목록. 새 파일이 생기면 여기 추가한다.
const OBJECTS = [
  "notices/6f65d417-2211-4a3f-ad25-6560f06c3c4c/poster.webp",
  "notices/6f65d417-2211-4a3f-ad25-6560f06c3c4c/gonggomun.docx",
  "notices/6f65d417-2211-4a3f-ad25-6560f06c3c4c/sinchungseo.docx",
  "notices/6f65d417-2211-4a3f-ad25-6560f06c3c4c/1784808933381-0.txt",
  "notices/6f65d417-2211-4a3f-ad25-6560f06c3c4c/1784810468648-2.docx",
];

const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY가 없습니다.\n" +
      "  Supabase 대시보드 > seoul-imosamchon-v2 > Project Settings > API Keys에서\n" +
      "  service_role 값을 복사해 아래처럼 실행하세요:\n\n" +
      "  SUPABASE_SERVICE_ROLE_KEY='붙여넣기' node scripts/copy-storage.mjs",
  );
  process.exit(1);
}

const srcBase = `https://${OLD_REF}.supabase.co/storage/v1/object/public/${BUCKET}`;
const dstBase = `https://${NEW_REF}.supabase.co/storage/v1/object/${BUCKET}`;

let ok = 0;
let fail = 0;

for (const path of OBJECTS) {
  try {
    const res = await fetch(`${srcBase}/${path}`);
    if (!res.ok) throw new Error(`다운로드 실패 ${res.status}`);

    const body = Buffer.from(await res.arrayBuffer());
    const type = res.headers.get("content-type") ?? "application/octet-stream";

    // x-upsert: 두 번 돌려도 덮어쓰기만 하고 에러가 나지 않는다
    const up = await fetch(`${dstBase}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": type,
        "x-upsert": "true",
      },
      body,
    });
    if (!up.ok) throw new Error(`업로드 실패 ${up.status} ${await up.text()}`);

    console.log(`✓ ${path} (${(body.length / 1024).toFixed(0)}KB)`);
    ok++;
  } catch (e) {
    console.error(`✗ ${path} — ${e.message}`);
    fail++;
  }
}

console.log(`\n완료: 성공 ${ok} · 실패 ${fail}`);
if (fail > 0) process.exit(1);
