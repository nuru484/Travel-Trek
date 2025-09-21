/*
  Warnings:

  - You are about to drop the column `hotelId` on the `Booking` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_hotelId_fkey";

-- DropIndex
DROP INDEX "Booking_userId_hotelId_key";

-- DropIndex
DROP INDEX "booking_user_tour_hotel_room_flight_idx";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "hotelId";

-- CreateIndex
CREATE INDEX "booking_user_tour_hotel_room_flight_idx" ON "Booking"("userId", "tourId", "roomId", "flightId");
