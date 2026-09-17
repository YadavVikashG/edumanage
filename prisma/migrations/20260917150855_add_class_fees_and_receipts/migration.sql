/*
  Warnings:

  - A unique constraint covering the columns `[receiptNo]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `receiptNo` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "receiptNo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SchoolClass" ADD COLUMN     "feeAmount" DECIMAL(10,2);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_receiptNo_key" ON "Payment"("receiptNo");
