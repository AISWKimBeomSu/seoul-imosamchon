import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // ⚠ 업스트림 기본값에서 세 가지를 바꿨다. `shadcn add`로 재생성하면 원복된다.
        //  1. h-8(34px) → min-h-[50px]  : 기존 .input과 동일. 터치 타깃 확보
        //  2. `md:text-sm` 제거          : 데스크톱에서만 글자를 14.9px로 줄이는
        //     규칙이다. 시니어 대상 사이트에서 정확히 반대로 가는 기본값이다.
        //  3. bg-transparent → bg-background : soft 배경 위 카드에서도 흰 입력창 유지
        "min-h-[50px] w-full min-w-0 rounded-lg border border-input bg-background px-[0.9rem] py-3 text-base transition-colors outline-none file:inline-flex file:h-9 file:border-0 file:bg-transparent file:text-base file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
