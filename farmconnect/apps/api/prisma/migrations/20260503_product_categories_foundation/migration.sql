-- AlterTable: categories multilingual fields
ALTER TABLE "categories" ADD COLUMN "nameEn" TEXT;
ALTER TABLE "categories" ADD COLUMN "nameAr" TEXT;

UPDATE "categories"
SET
  "nameEn" = COALESCE("name"->>'en', "slug"),
  "nameAr" = COALESCE("name"->>'ar', "slug");

ALTER TABLE "categories" ALTER COLUMN "nameEn" SET NOT NULL;
ALTER TABLE "categories" ALTER COLUMN "nameAr" SET NOT NULL;

ALTER TABLE "categories" DROP COLUMN "name";
