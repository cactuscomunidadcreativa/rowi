-- CreateTable
CREATE TABLE "affinity_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "traits" JSONB NOT NULL DEFAULT '{}',
    "clusters" JSONB NOT NULL DEFAULT '{}',
    "scores" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "affinity_profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affinity_profile_userId_key" ON "affinity_profile"("userId");

-- AddForeignKey
ALTER TABLE "affinity_profile" ADD CONSTRAINT "affinity_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
