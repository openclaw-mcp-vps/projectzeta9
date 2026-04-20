# Build Task: projectzeta9

Build a complete, production-ready Next.js 15 App Router application.

PROJECT: projectzeta9
HEADLINE: project_zeta_9
WHAT: ProjectZeta9 automates project milestone tracking and deadline management for software teams. It integrates with existing tools to surface blockers before they derail timelines and sends smart alerts when projects drift off course.
WHY: Engineering teams waste 23% of their time on status updates and still miss critical deadlines. Remote work made project visibility worse - managers are flying blind while developers context-switch between Slack, Jira, and spreadsheets.
WHO PAYS: Engineering managers at 10-50 person startups who juggle 3-8 concurrent projects. Teams using multiple tools (GitHub, Linear, Notion) but lacking unified project health visibility. Perfect for post-Series A companies scaling beyond informal coordination.
NICHE: micro-saas
PRICE: $$15/mo

ARCHITECTURE SPEC:
Next.js SaaS with dashboard for project health monitoring, webhook integrations for GitHub/Linear/Notion, and automated alert system. Uses PostgreSQL for project data, Redis for real-time updates, and background jobs for deadline analysis.

PLANNED FILES:
- app/dashboard/page.tsx
- app/api/webhooks/github/route.ts
- app/api/webhooks/linear/route.ts
- app/api/projects/route.ts
- app/api/alerts/route.ts
- components/ProjectHealthCard.tsx
- components/MilestoneTimeline.tsx
- components/IntegrationSetup.tsx
- lib/integrations/github.ts
- lib/integrations/linear.ts
- lib/deadline-analyzer.ts
- lib/alert-engine.ts
- prisma/schema.prisma
- app/pricing/page.tsx
- app/onboarding/page.tsx

DEPENDENCIES: next, tailwindcss, prisma, @prisma/client, redis, bull, @octokit/rest, @linear/sdk, notion-client, resend, lemonsqueezy.js, recharts, date-fns, zod, next-auth

REQUIREMENTS:
- Next.js 15 with App Router (app/ directory)
- TypeScript
- Tailwind CSS v4
- shadcn/ui components (npx shadcn@latest init, then add needed components)
- Dark theme ONLY — background #0d1117, no light mode
- Lemon Squeezy checkout overlay for payments
- Landing page that converts: hero, problem, solution, pricing, FAQ
- The actual tool/feature behind a paywall (cookie-based access after purchase)
- Mobile responsive
- SEO meta tags, Open Graph tags
- /api/health endpoint that returns {"status":"ok"}
- NO HEAVY ORMs: Do NOT use Prisma, Drizzle, TypeORM, Sequelize, or Mongoose. If the tool needs persistence, use direct SQL via `pg` (Postgres) or `better-sqlite3` (local), or just filesystem JSON. Reason: these ORMs require schema files and codegen steps that fail on Vercel when misconfigured.
- INTERNAL FILE DISCIPLINE: Every internal import (paths starting with `@/`, `./`, or `../`) MUST refer to a file you actually create in this build. If you write `import { Card } from "@/components/ui/card"`, then `components/ui/card.tsx` MUST exist with a real `export const Card` (or `export default Card`). Before finishing, scan all internal imports and verify every target file exists. Do NOT use shadcn/ui patterns unless you create every component from scratch — easier path: write all UI inline in the page that uses it.
- DEPENDENCY DISCIPLINE: Every package imported in any .ts, .tsx, .js, or .jsx file MUST be
  listed in package.json dependencies (or devDependencies for build-only). Before finishing,
  scan all source files for `import` statements and verify every external package (anything
  not starting with `.` or `@/`) appears in package.json. Common shadcn/ui peers that MUST
  be added if used:
  - lucide-react, clsx, tailwind-merge, class-variance-authority
  - react-hook-form, zod, @hookform/resolvers
  - @radix-ui/* (for any shadcn component)
- After running `npm run build`, if you see "Module not found: Can't resolve 'X'", add 'X'
  to package.json dependencies and re-run npm install + npm run build until it passes.

ENVIRONMENT VARIABLES (create .env.example):
- NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID
- NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID
- LEMON_SQUEEZY_WEBHOOK_SECRET

After creating all files:
1. Run: npm install
2. Run: npm run build
3. Fix any build errors
4. Verify the build succeeds with exit code 0

Do NOT use placeholder text. Write real, helpful content for the landing page
and the tool itself. The tool should actually work and provide value.
