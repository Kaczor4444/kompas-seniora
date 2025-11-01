-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."Placowka" (
    "id" SERIAL NOT NULL,
    "nazwa" TEXT NOT NULL,
    "typ_placowki" TEXT NOT NULL,
    "prowadzacy" TEXT,
    "ulica" TEXT,
    "miejscowosc" TEXT NOT NULL,
    "kod_pocztowy" TEXT,
    "gmina" TEXT,
    "powiat" TEXT NOT NULL,
    "wojewodztwo" TEXT NOT NULL,
    "telefon" TEXT,
    "email" TEXT,
    "www" TEXT,
    "liczba_miejsc" INTEGER,
    "profil_opieki" TEXT,
    "koszt_pobytu" DOUBLE PRECISION,
    "data_aktualizacji" TIMESTAMP(3),
    "zrodlo" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Placowka_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TerytLocation" (
    "id" SERIAL NOT NULL,
    "nazwa" TEXT NOT NULL,
    "nazwa_normalized" TEXT NOT NULL,
    "typ" TEXT NOT NULL,
    "gmina" TEXT,
    "powiat" TEXT NOT NULL,
    "wojewodztwo" TEXT NOT NULL,

    CONSTRAINT "TerytLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SharedList" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "ids" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SharedList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Placowka_powiat_idx" ON "public"."Placowka"("powiat");

-- CreateIndex
CREATE INDEX "Placowka_wojewodztwo_idx" ON "public"."Placowka"("wojewodztwo");

-- CreateIndex
CREATE INDEX "Placowka_typ_placowki_idx" ON "public"."Placowka"("typ_placowki");

-- CreateIndex
CREATE INDEX "TerytLocation_nazwa_normalized_idx" ON "public"."TerytLocation"("nazwa_normalized");

-- CreateIndex
CREATE INDEX "TerytLocation_powiat_idx" ON "public"."TerytLocation"("powiat");

-- CreateIndex
CREATE INDEX "TerytLocation_wojewodztwo_idx" ON "public"."TerytLocation"("wojewodztwo");

-- CreateIndex
CREATE UNIQUE INDEX "SharedList_token_key" ON "public"."SharedList"("token");

-- CreateIndex
CREATE INDEX "SharedList_token_idx" ON "public"."SharedList"("token");

-- CreateIndex
CREATE INDEX "SharedList_created_idx" ON "public"."SharedList"("created");

