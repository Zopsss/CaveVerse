-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatarId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "RecentMaps" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "mapId" TEXT NOT NULL,

    CONSTRAINT "RecentMaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMaps" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "mapId" TEXT NOT NULL,

    CONSTRAINT "UserMaps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "RecentMaps" ADD CONSTRAINT "RecentMaps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMaps" ADD CONSTRAINT "UserMaps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
