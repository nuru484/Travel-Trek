/*
  Warnings:

  - You are about to drop the column `available` on the `Room` table. All the data in the column will be lost.
  - Added the required column `capacity` to the `Flight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalRooms` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "room_available_idx";

-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "capacity" INTEGER NOT NULL,
ALTER COLUMN "seatsAvailable" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "available",
ADD COLUMN     "roomsAvailable" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalRooms" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Tour" ADD COLUMN     "guestsBooked" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "flight_seats_available_idx" ON "Flight"("seatsAvailable");

-- CreateIndex
CREATE INDEX "room_availability_idx" ON "Room"("roomsAvailable");

-- CreateIndex
CREATE INDEX "tour_guest_booked_idx" ON "Tour"("guestsBooked");
