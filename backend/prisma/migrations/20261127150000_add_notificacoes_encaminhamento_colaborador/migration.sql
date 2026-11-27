-- AlterEnum
-- Novos tipos de notificação: chamado encaminhado e colaborador adicionado.
-- Ficam antes de SISTEMA, na mesma ordem do schema.prisma (como TICKET_APROVACAO).
-- Mais de um ADD VALUE na mesma migration exige PostgreSQL 12+ (o projeto usa o 16).
ALTER TYPE "TipoNotificacao" ADD VALUE 'TICKET_ENCAMINHADO' BEFORE 'SISTEMA';
ALTER TYPE "TipoNotificacao" ADD VALUE 'TICKET_COLABORADOR' BEFORE 'SISTEMA';
