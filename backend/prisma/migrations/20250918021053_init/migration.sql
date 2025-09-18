/*
  Warnings:

  - A unique constraint covering the columns `[userId,tourId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,hotelId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,roomId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,flightId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Booking_userId_tourId_key" ON "Booking"("userId", "tourId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_userId_hotelId_key" ON "Booking"("userId", "hotelId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_userId_roomId_key" ON "Booking"("userId", "roomId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_userId_flightId_key" ON "Booking"("userId", "flightId");
