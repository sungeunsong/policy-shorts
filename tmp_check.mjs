import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
p.run.findMany({ take: 3, orderBy: { startedAt: "desc" } }).then(r => console.dir(r, { depth: null })).catch(console.error).finally(() => p.$disconnect());
