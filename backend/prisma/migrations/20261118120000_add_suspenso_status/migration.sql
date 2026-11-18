-- AlterEnum
-- BEFORE 'FECHADO' mantém a ordem do tipo igual à do enum em schema.prisma
-- (o fechado continua sendo o último valor).
ALTER TYPE "StatusTicket" ADD VALUE 'SUSPENSO' BEFORE 'FECHADO';
