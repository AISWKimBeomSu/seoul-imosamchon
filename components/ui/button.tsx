import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ⚠ 시니어(50+) 대상 사이트다. 아래 크기·글자 기본값은 접근성 요구사항이지
//    취향이 아니다. shadcn 업스트림 기본값(h-8=34px, text-sm=14.9px)은 전부
//    WCAG 2.5.5 최소 터치 타깃 44px과 TSD §9의 "14px 이하 금지"에 미달한다.
//    `shadcn add`로 이 파일을 다시 받으면 아래 값이 원복되므로 반드시 확인할 것.
//    - 모든 size는 44px 이상, 기본은 .btn과 동일한 52px
//    - 글자는 text-base(17px) 이상, 굵기 700 (기존 .btn과 동일)
//    - 알약 형태(rounded-full)도 기존 .btn과 맞춰, 나중에 공개 페이지의
//      .btn을 이 컴포넌트로 대체할 수 있게 해 둔다
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-base font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // 최소 44px은 바닥이다(WCAG 2.5.5). 그래서 xs·sm이 같은 높이를 갖는다 —
      // 좁은 자리용으로 더 줄이고 싶어도 여기가 한계다. 가로 여백만 다르다.
      size: {
        default:
          "min-h-[52px] gap-2 px-[1.9rem] has-data-[icon=inline-end]:pr-6 has-data-[icon=inline-start]:pl-6",
        xs: "min-h-[44px] gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        sm: "min-h-[44px] gap-1.5 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        lg: "min-h-[60px] gap-2 px-8 text-lg has-data-[icon=inline-end]:pr-7 has-data-[icon=inline-start]:pl-7",
        icon: "size-[52px]",
        "icon-xs": "size-[44px]",
        "icon-sm": "size-[44px]",
        "icon-lg": "size-[60px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
