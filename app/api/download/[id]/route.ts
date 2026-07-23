import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: att } = await supabase
    .from("attachments")
    .select("storage_path, original_name, mime_type")
    .eq("id", id)
    .maybeSingle();

  if (!att) return new NextResponse("파일을 찾을 수 없습니다.", { status: 404 });

  // 다운로드 수 카운트 (SECURITY DEFINER 함수, 실패해도 다운로드는 계속)
  await supabase.rpc("increment_download", { att_id: id });

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/${att.storage_path}`;
  const fileRes = await fetch(publicUrl);
  if (!fileRes.ok || !fileRes.body) {
    return new NextResponse("파일을 불러오지 못했습니다.", { status: 502 });
  }

  const filename = encodeURIComponent(att.original_name);
  return new NextResponse(fileRes.body, {
    headers: {
      "Content-Type": att.mime_type || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
      "Cache-Control": "no-store",
    },
  });
}
