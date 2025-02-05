-- DropForeignKey
ALTER TABLE "RecentMaps" DROP CONSTRAINT "RecentMaps_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserMaps" DROP CONSTRAINT "UserMaps_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "User_id_key";

-- AddForeignKey
ALTER TABLE "RecentMaps" ADD CONSTRAINT "RecentMaps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMaps" ADD CONSTRAINT "UserMaps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
