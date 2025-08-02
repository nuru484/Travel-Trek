/*
  Warnings:

  - Added the required column `duration` to the `Flight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `flightClass` to the `Flight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `Hotel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `Hotel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Destination" ADD COLUMN     "photo" TEXT;

-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "flightClass" TEXT NOT NULL,
ADD COLUMN     "photo" TEXT,
ADD COLUMN     "stops" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Hotel" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "photo" TEXT;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "amenities" TEXT[],
ADD COLUMN     "description" TEXT,
ADD COLUMN     "photo" TEXT;
