import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 에이전트 작업용 git worktree가 .claude/worktrees/*에 생기고, 그 안에서
    // 빌드가 돌면 .next 산출물이 남는다. 위 ".next/**"는 루트만 잡아서
    // `npm run lint`가 그 산출물까지 훑고 만 단위 오류를 뱉는다.
    // (git에서는 .git/info/exclude가 이미 무시하므로 커밋에는 안 들어간다.)
    ".claude/**",
  ]),
]);

export default eslintConfig;
