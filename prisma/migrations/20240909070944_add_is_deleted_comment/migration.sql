-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "comments_is_deleted_idx" ON "comments"("is_deleted");
