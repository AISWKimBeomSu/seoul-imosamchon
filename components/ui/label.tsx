"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        // ⚠ 업스트림은 text-sm(14.9px)/font-medium. 기존 .field > label과 같은
        //    16.15px/700으로 올렸다. `shadcn add` 재생성 시 원복되니 확인할 것.
        "flex items-center gap-2 text-[0.95rem] leading-none font-bold select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
