"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * 인원 선택.
 *
 * 자유 입력란을 두지 않는다 — 시니어에게 숫자 키패드를 열게 하고 검증 에러를
 * 돌려주는 것보다, 누를 수 있는 버튼 두 개가 훨씬 빠르다. 상한에 닿으면
 * 버튼을 흐리게만 하지 않고 왜 못 누르는지 문장으로 말해 준다.
 *
 * 참조: docs/PLATFORM.md §8.2
 */
export default function GuestStepper({
  name = "guests",
  max,
  defaultValue = 1,
  locale,
}: {
  name?: string;
  /** 이 회차에 남은 자리 (1 미만이면 렌더하지 않는 쪽이 맞다) */
  max: number;
  defaultValue?: number;
  locale: "ko" | "en";
}) {
  const en = locale === "en";
  const ceiling = Math.max(1, max);
  const [value, setValue] = useState(Math.min(Math.max(1, defaultValue), ceiling));
  const labelId = useId();

  const atMin = value <= 1;
  const atMax = value >= ceiling;

  return (
    <div>
      <span id={labelId} className="block font-bold">
        {en ? "How many people?" : "몇 분이 오시나요?"}
      </span>

      <div className="mt-3 flex items-center gap-4">
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={en ? "One fewer person" : "인원 한 명 줄이기"}
          disabled={atMin}
          onClick={() => setValue((v) => Math.max(1, v - 1))}
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            −
          </span>
        </Button>

        {/* 값 자체는 버튼이 아니다. 읽히기만 하면 된다. */}
        <output
          aria-live="polite"
          aria-labelledby={labelId}
          className="min-w-[4.5rem] text-center text-2xl font-extrabold tabular-nums"
        >
          {en ? `${value}` : `${value}명`}
        </output>

        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={en ? "One more person" : "인원 한 명 늘리기"}
          disabled={atMax}
          onClick={() => setValue((v) => Math.min(ceiling, v + 1))}
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            +
          </span>
        </Button>
      </div>

      {/* 상한에 닿았을 때 이유를 말한다. 흐려진 버튼만으로는 고장인지 한계인지 모른다. */}
      {atMax && (
        <p className="mt-2 text-sub">
          {en
            ? `This session can take up to ${ceiling} people.`
            : `이 회차는 ${ceiling}명까지 예약할 수 있어요.`}
        </p>
      )}

      <input type="hidden" name={name} value={value} />
    </div>
  );
}
