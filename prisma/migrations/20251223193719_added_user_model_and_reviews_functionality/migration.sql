-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ROLE_ADMIN', 'ROLE_MODERATOR', 'ROLE_NORMAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ROLE_NORMAL',
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "nick_name" TEXT,
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "dob" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "rating" DECIMAL(65,30) NOT NULL,
    "reviewBody" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserReviews_userId_bookId_key" ON "UserReviews"("userId", "bookId");

-- AddForeignKey
ALTER TABLE "UserReviews" ADD CONSTRAINT "UserReviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReviews" ADD CONSTRAINT "UserReviews_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



CREATE VIEW "PopularBooks" AS
SELECT
    "Book".id,
    "Book".title,
    "Author".name AS "authorName",
    "Publisher".name AS "publisherName",
    AVG("UserReviews".rating) AS "averageRating"
FROM "UserReviews"
         JOIN "Book" ON "Book".id = "UserReviews"."bookId"
         JOIN "Author" ON "Author".id = "Book"."authorId"
         JOIN "Publisher" ON "Publisher".id = "Book"."publisherId"
GROUP BY "Book".id, "Book".title, "Author".name, "Publisher".name
HAVING AVG("UserReviews".rating) > 4;

