-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Etat" AS ENUM ('STATUS_01', 'STATUS_02', 'STATUS_03', 'STATUS_04', 'STATUS_05', 'STATUS_06', 'STATUS_07', 'STATUS_08', 'STATUS_09', 'STATUS_10', 'STATUS_11', 'STATUS_12', 'STATUS_13', 'STATUS_14', 'STATUS_15');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "canEditOrders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canEditProducts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canEditStatuses" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canEditUsers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewDashboard" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewOrders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewProducts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewReporting" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewStatuses" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewUsers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "encryptedPassword" TEXT,
ADD COLUMN     "iconColor" TEXT NOT NULL DEFAULT '#2563eb',
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastLogoutAt" TIMESTAMP(3),
ADD COLUMN     "lastSeenAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paymentDefaultDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentRemainingDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "roleColor" TEXT NOT NULL DEFAULT '#f3f4f6',
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "Status" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "etat" "Etat" NOT NULL DEFAULT 'STATUS_01',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "recallAfterH" INTEGER,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "productNote" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "statusId" TEXT,
    "agentId" TEXT,
    "recallAt" TIMESTAMP(3),
    "firstProcessedAt" TIMESTAMP(3),
    "processingTimeMin" INTEGER,
    "recallAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "vendor" TEXT,
    "productType" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "assignedAgentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hiddenForAgentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OrderToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OrderToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Status_name_key" ON "Status"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopifyId_key" ON "Product"("shopifyId");

-- CreateIndex
CREATE INDEX "_OrderToProduct_B_index" ON "_OrderToProduct"("B");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderToProduct" ADD CONSTRAINT "_OrderToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderToProduct" ADD CONSTRAINT "_OrderToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
