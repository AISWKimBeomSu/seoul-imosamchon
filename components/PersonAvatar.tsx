import Image from "next/image";
import { photoUrl, type Person } from "@/lib/people";

/**
 * 사진이 없어도 카드가 완성돼 보이게 한다.
 * 시니어 사진 확보는 늦어지기 마련인데, 그때 페이지가 비어 보이면
 * "준비 안 된 브랜드"로 읽힌다. 이니셜 아바타가 그 구멍을 메운다.
 */
export default function PersonAvatar({
  person,
  size = 132,
}: {
  person: Person;
  size?: number;
}) {
  const src = photoUrl(person.photo_path);

  if (!src) {
    return (
      <div
        className="pavatar pavatar-fallback"
        style={{ width: size, height: size }}
        role="img"
        aria-label={`${person.name} 님 (사진 준비 중)`}
      >
        <span aria-hidden="true">{person.name.trim().charAt(0)}</span>
      </div>
    );
  }

  return (
    <Image
      className="pavatar"
      src={src}
      alt={person.photo_alt} // DB CHECK 제약 덕에 빈 값이 올 수 없다
      width={size}
      height={size}
      sizes={`${size}px`}
    />
  );
}
