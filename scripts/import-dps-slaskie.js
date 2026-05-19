#!/usr/bin/env node
// Import DPS z województwa Śląskiego
// Źródło: Rejestr DPS Śląskiego (katowice.uw.gov.pl, aktualizacja 12.03.2026)
// Użycie: node scripts/import-dps-slaskie.js
// Czas: ~2 min (geocoding Nominatim 1req/s)

require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();
const NOMINATIM_DELAY = 1200;

// Mapowanie opisu z PDF → kod profilu opieki w aplikacji
// A=Niepełnosprawn. intelektualna, B=Zaburzenia psych., E=Osoby starsze,
// F=Choroby somatyczne, G=Dzieci niepełnosp., H=Młodzież niepełnosp., I=Niepełnosp. fizyczna
function mapProfil(desc) {
  const d = (desc || '').toLowerCase();
  const codes = [];
  if (d.includes('podeszł')) codes.push('E');
  if (d.includes('somatycznie')) codes.push('F');
  if (d.includes('psychicznie')) codes.push('B');
  if (d.includes('dorosł') && d.includes('intelektualnie')) codes.push('A');
  if (d.includes('dzieci') && d.includes('intelektualnie')) codes.push('G');
  if (d.includes('młodzież') && d.includes('intelektualnie')) codes.push('H');
  if (d.includes('fizycznie')) codes.push('I');
  return codes.join(',') || null;
}

// Wszystkie DPS Śląskie z rejestru (pominięte ID 33,34,35,36 — już w bazie)
// Format: { nazwa, ulica, miejscowosc, kod, powiat, telefon, liczba_miejsc, profil_desc, prowadzacy, jst_nazwa, oficjalne_id, sekcja }
// sekcja: 'ponadgminne' | 'miejskie' | 'bez_zlecenia'
const DPS_SLASKIE = [
  // ===== SEKCJA 1: PONADGMINNE (lp 3-87, pomijamy 1,2,29,30 = już w bazie) =====
  { oficjalne_id: 3,  nazwa: 'Dom Pomocy Społecznej "Kombatant"', ulica: 'ul. Stolarzowicka 33', miejscowosc: 'Bytom', kod: '41-908', powiat: 'm. Bytom', telefon: '32/286-37-16', liczba_miejsc: 128, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Miasto na prawach powiatu Bytom', jst_nazwa: 'Miasto Bytom' },
  { oficjalne_id: 4,  nazwa: 'Dom Pomocy Społecznej "Nadzieja"', ulica: 'ul. Wandy 64', miejscowosc: 'Chorzów', kod: '41-500', powiat: 'm. Chorzów', telefon: '32/241-15-13', liczba_miejsc: 60, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Miasto na prawach powiatu Chorzów', jst_nazwa: 'Miasto Chorzów' },
  { oficjalne_id: 5,  nazwa: 'Dom Pomocy Społecznej w Turowie', ulica: 'ul. Joachimowska 85', miejscowosc: 'Turów', kod: '42-256', powiat: 'częstochowski', telefon: '34/328-60-78', liczba_miejsc: 57, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Powiat Częstochowski', jst_nazwa: 'Powiat Częstochowski' },
  { oficjalne_id: 6,  nazwa: 'Dom Pomocy Społecznej "Nasz Dom"', ulica: 'ul. Derkacza 10', miejscowosc: 'Gliwice', kod: '44-100', powiat: 'm. Gliwice', telefon: '32/232-19-60', liczba_miejsc: 122, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Miasto na prawach powiatu Gliwice', jst_nazwa: 'Miasto Gliwice' },
  { oficjalne_id: 7,  nazwa: 'Dom Pomocy Społecznej "Zacisze"', ulica: 'ul. Traktorzystów 42', miejscowosc: 'Katowice', kod: '40-695', powiat: 'm. Katowice', telefon: '32/202-54-32', liczba_miejsc: 98, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Miasto na prawach powiatu Katowice', jst_nazwa: 'Miasto Katowice' },
  { oficjalne_id: 8,  nazwa: 'Senior Residence Dom Pomocy Społecznej', ulica: 'ul. Pijarska 4', miejscowosc: 'Katowice', kod: '40-750', powiat: 'm. Katowice', telefon: '32/353-58-40', liczba_miejsc: 97, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Fundacja Laurentius', jst_nazwa: 'Miasto Katowice' },
  { oficjalne_id: 9,  nazwa: 'Dom Pomocy Społecznej "Złota Jesień"', ulica: 'ul. Grzonki 1', miejscowosc: 'Racibórz', kod: '47-400', powiat: 'raciborski', telefon: '32/415-31-36', liczba_miejsc: 190, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Powiat Raciborski', jst_nazwa: 'Powiat Raciborski' },
  { oficjalne_id: 10, nazwa: 'Dom Pomocy Społecznej w Sosnowcu "ZAKĄTEK"', ulica: 'ul. Andersa 81B', miejscowosc: 'Sosnowiec', kod: '41-200', powiat: 'm. Sosnowiec', telefon: '32/266-50-42', liczba_miejsc: 70, profil_desc: 'osoby w podeszłym wieku oraz osoby przewlekle somatycznie chore', prowadzacy: 'Miasto na prawach powiatu Sosnowiec', jst_nazwa: 'Miasto Sosnowiec' },
  { oficjalne_id: 11, nazwa: 'Dom Pomocy Społecznej Nr 2', ulica: 'ul. Jagiellońska 2', miejscowosc: 'Sosnowiec', kod: '41-200', powiat: 'm. Sosnowiec', telefon: '32/292-32-39', liczba_miejsc: 80, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Miasto na prawach powiatu Sosnowiec', jst_nazwa: 'Miasto Sosnowiec' },
  { oficjalne_id: 12, nazwa: 'Dom Pomocy Społecznej Nr 1', ulica: 'ul. Matejki 62', miejscowosc: 'Zabrze', kod: '41-800', powiat: 'm. Zabrze', telefon: '32/271-42-58', liczba_miejsc: 100, profil_desc: 'osoby w podeszłym wieku oraz osoby niepełnosprawne fizycznie', prowadzacy: 'Miasto na prawach powiatu Zabrze', jst_nazwa: 'Miasto Zabrze' },
  { oficjalne_id: 13, nazwa: 'Dom Pomocy Społecznej w Żywcu', ulica: 'ul. Śliżowy Potok 8', miejscowosc: 'Żywiec', kod: '34-300', powiat: 'żywiecki', telefon: '33/861-23-08', liczba_miejsc: 100, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Powiat Żywiecki', jst_nazwa: 'Powiat Żywiecki' },
  { oficjalne_id: 14, nazwa: 'Dom Pomocy Społecznej Caritas Diecezji Gliwickiej', ulica: 'ul. Wiejska 42A', miejscowosc: 'Wiśnicze', kod: '44-185', powiat: 'gliwicki', telefon: '32/233-61-78', liczba_miejsc: 100, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Caritas Diecezji Gliwickiej', jst_nazwa: 'Powiat Gliwicki' },
  { oficjalne_id: 15, nazwa: 'Ośrodek Święta Elżbieta — Dom Pomocy Społecznej', ulica: 'ul. Wolności 30', miejscowosc: 'Ruda Śląska', kod: '41-700', powiat: 'm. Ruda Śląska', telefon: '32/243-65-94', liczba_miejsc: 98, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Ośrodek Święta Elżbieta', jst_nazwa: 'Miasto Ruda Śląska' },
  { oficjalne_id: 16, nazwa: 'Caritas Archidiecezji Katowickiej Ośrodek św. Anna Dom Pomocy Społecznej', ulica: 'ul. Kopernika 6', miejscowosc: 'Tychy', kod: '43-100', powiat: 'm. Tychy', telefon: '32/328-25-25', liczba_miejsc: 54, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Caritas Archidiecezji Katowickiej', jst_nazwa: 'Miasto Tychy' },
  { oficjalne_id: 17, nazwa: 'Dom Pomocy Społecznej św. Wincentego', ulica: 'ul. Powstańców 45', miejscowosc: 'Chorzów', kod: '41-500', powiat: 'm. Chorzów', telefon: '32/346-24-60', liczba_miejsc: 82, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Zgromadzenie Sióstr Miłosierdzia św. Wincentego a Paulo', jst_nazwa: 'Miasto Chorzów' },
  { oficjalne_id: 18, nazwa: 'Caritas Archidiecezji Katowickiej Ośrodek Święty Florian Dom Pomocy Społecznej', ulica: 'ul. Harcerska 3', miejscowosc: 'Chorzów', kod: '41-500', powiat: 'm. Chorzów', telefon: '32/241-10-45', liczba_miejsc: 51, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Caritas Archidiecezji Katowickiej', jst_nazwa: 'Miasto Chorzów' },
  { oficjalne_id: 19, nazwa: 'DPS p.w. Św. Antoniego Zgromadzenia Sióstr Miłosierdzia Św. Wincentego a Paulo', ulica: 'ul. Wieluńska 1', miejscowosc: 'Częstochowa', kod: '42-200', powiat: 'm. Częstochowa', telefon: '34/324-29-14', liczba_miejsc: 135, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Zgromadzenie Sióstr Miłosierdzia św. Wincentego a Paulo', jst_nazwa: 'Miasto Częstochowa' },
  { oficjalne_id: 20, nazwa: 'DPS "Nazaret"', ulica: 'ul. Odrowążów 124', miejscowosc: 'Gliwice', kod: '44-103', powiat: 'm. Gliwice', telefon: '32/332-06-32', liczba_miejsc: 48, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Zgromadzenie Sióstr Służebniczek NMP Niepokalanie Poczętej', jst_nazwa: 'Miasto Gliwice' },
  { oficjalne_id: 21, nazwa: 'Ewangelicki Dom Opieki "Ostoja Pokoju" Fundacji Diakonii im. Matki Ewy', ulica: 'ul. Matki Ewy 1', miejscowosc: 'Bytom', kod: '41-923', powiat: 'm. Bytom', telefon: '32/286-34-00', liczba_miejsc: 98, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Fundacja Diakonii im. Matki Ewy', jst_nazwa: 'Miasto Bytom' },
  { oficjalne_id: 22, nazwa: 'Ewangelicki Dom Opieki "Emaus"', ulica: 'ul. Ks. Karola Kulisza 47', miejscowosc: 'Dzięgielów', kod: '43-445', powiat: 'cieszyński', telefon: '33/852-97-12', liczba_miejsc: 89, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Diakonat Żeński Eben-Ezer Kościoła Ewangelicko-Augsburskiego w RP', jst_nazwa: 'Powiat Cieszyński' },
  { oficjalne_id: 23, nazwa: 'Międzygminny Dom Pomocy Społecznej "Dobre Miejsce" w Kobiórze', ulica: 'ul. Promnicka 53', miejscowosc: 'Kobiór', kod: '43-210', powiat: 'pszczyński', telefon: '32/307-58-02', liczba_miejsc: 66, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Związek Międzygminny Tychy i Gmina Kobiór', jst_nazwa: 'Powiat Pszczyński' },
  { oficjalne_id: 24, nazwa: 'Powiatowy Dom Pomocy Społecznej "Pogodna Jesień"', ulica: 'ul. Korfantego 1', miejscowosc: 'Cieszyn', kod: '43-400', powiat: 'cieszyński', telefon: '33/852-17-61', liczba_miejsc: 70, profil_desc: 'osoby w podeszłym wieku oraz osoby przewlekle somatycznie chore', prowadzacy: 'Powiat Cieszyński', jst_nazwa: 'Powiat Cieszyński' },
  { oficjalne_id: 25, nazwa: 'Dom Opieki "Samarytanin"', ulica: 'ul. Bednarska 8', miejscowosc: 'Bielsko-Biała', kod: '43-316', powiat: 'bielski', telefon: '33/814-21-92', liczba_miejsc: 91, profil_desc: 'osoby w podeszłym wieku oraz osoby przewlekle somatycznie chore', prowadzacy: 'Kościół Adwentystów Dnia Siódmego w RP', jst_nazwa: 'Powiat Bielski' },
  { oficjalne_id: 26, nazwa: 'Dom Pomocy Społecznej "Betania"', ulica: 'ul. Katowicka 1', miejscowosc: 'Cieszyn', kod: '43-400', powiat: 'cieszyński', telefon: '33/851-02-44', liczba_miejsc: 30, profil_desc: 'osoby w podeszłym wieku oraz osoby przewlekle somatycznie chore', prowadzacy: 'Zgromadzenie Sióstr św. Elżbiety', jst_nazwa: 'Powiat Cieszyński' },
  { oficjalne_id: 27, nazwa: 'Dom Pomocy Społecznej w Wilkowicach', ulica: 'ul. Kościelna 5', miejscowosc: 'Wilkowice', kod: '43-365', powiat: 'bielski', telefon: '33/817-14-91', liczba_miejsc: 62, profil_desc: 'osoby w podeszłym wieku oraz osoby niepełnosprawne fizycznie', prowadzacy: 'Powiat Bielski', jst_nazwa: 'Powiat Bielski' },
  { oficjalne_id: 28, nazwa: 'Dom Pomocy Społecznej im. Papieża Jana Pawła II', ulica: 'ul. Bogumińska 22', miejscowosc: 'Gorzyce', kod: '44-350', powiat: 'wodzisławski', telefon: '32/451-12-25', liczba_miejsc: 218, profil_desc: 'osoby w podeszłym wieku oraz osoby niepełnosprawne fizycznie', prowadzacy: 'Powiat Wodzisławski', jst_nazwa: 'Powiat Wodzisławski' },
  // lp 29 = ID 35 (już w bazie), lp 30 = ID 33 (już w bazie)
  { oficjalne_id: 31, nazwa: 'Dom Pomocy Społecznej "Opoka"', ulica: 'ul. Pszczyńska 100', miejscowosc: 'Gliwice', kod: '44-100', powiat: 'm. Gliwice', telefon: '32/232-21-91', liczba_miejsc: 57, profil_desc: 'osoby przewlekle somatycznie chore', prowadzacy: 'Miasto na prawach powiatu Gliwice', jst_nazwa: 'Miasto Gliwice' },
  { oficjalne_id: 32, nazwa: 'Dom Pomocy Społecznej "Pod Dębem"', ulica: 'ul. Norwida 1', miejscowosc: 'Dąbrowa Górnicza', kod: '41-300', powiat: 'm. Dąbrowa Górnicza', telefon: '32/264-23-23', liczba_miejsc: 110, profil_desc: 'osoby przewlekle somatycznie chore', prowadzacy: 'Miasto na prawach powiatu Dąbrowa Górnicza', jst_nazwa: 'Miasto Dąbrowa Górnicza' },
  { oficjalne_id: 33, nazwa: 'Dom Pomocy Społecznej w Jaworznie', ulica: 'ul. Obrońców Poczty Gdańskiej 63', miejscowosc: 'Jaworzno', kod: '43-600', powiat: 'm. Jaworzno', telefon: '32/616-24-91', liczba_miejsc: 108, profil_desc: 'osoby przewlekle somatycznie chore', prowadzacy: 'Miasto na prawach powiatu Jaworzno', jst_nazwa: 'Miasto Jaworzno' },
  { oficjalne_id: 34, nazwa: 'Dom Pomocy Społecznej "Przystań"', ulica: 'ul. ks. bpa Adamskiego 22', miejscowosc: 'Katowice', kod: '40-069', powiat: 'm. Katowice', telefon: '32/251-52-16', liczba_miejsc: 88, profil_desc: 'osoby przewlekle somatycznie chore', prowadzacy: 'Miasto na prawach powiatu Katowice', jst_nazwa: 'Miasto Katowice' },
  { oficjalne_id: 35, nazwa: 'DPS "Dom Kombatanta" im. św. Rafała Kalinowskiego', ulica: 'ul. dr E. Cyrana 10', miejscowosc: 'Lubliniec', kod: '42-700', powiat: 'lubliniecki', telefon: '34/356-41-92', liczba_miejsc: 185, profil_desc: 'osoby przewlekle somatycznie chore', prowadzacy: 'Powiat Lubliniecki', jst_nazwa: 'Powiat Lubliniecki' },
  { oficjalne_id: 36, nazwa: 'Dom Pomocy Społecznej "Senior"', ulica: 'ul. Puszkina 7', miejscowosc: 'Ruda Śląska', kod: '41-704', powiat: 'm. Ruda Śląska', telefon: '32/248-17-74', liczba_miejsc: 180, profil_desc: 'osoby przewlekle somatycznie chore', prowadzacy: 'Miasto na prawach powiatu Ruda Śląska', jst_nazwa: 'Miasto Ruda Śląska' },
  { oficjalne_id: 37, nazwa: 'Dom Pomocy Społecznej "Przyjaźń"', ulica: 'ul. Włoska 24', miejscowosc: 'Tarnowskie Góry', kod: '42-600', powiat: 'tarnogórski', telefon: '32/285-58-98', liczba_miejsc: 130, profil_desc: 'osoby przewlekle somatycznie chore', prowadzacy: 'Powiat Tarnogórski', jst_nazwa: 'Powiat Tarnogórski' },
  { oficjalne_id: 38, nazwa: 'Dom Hospicyjny', ulica: 'ul. Żorska 17', miejscowosc: 'Tychy', kod: '43-100', powiat: 'm. Tychy', telefon: '32/783-28-00', liczba_miejsc: 16, profil_desc: 'osoby przewlekle somatycznie chore', prowadzacy: 'Społeczne Stowarzyszenie Hospicjum im. św. Kaliksta I', jst_nazwa: 'Miasto Tychy' },
  { oficjalne_id: 39, nazwa: 'Dom Pomocy Społecznej nr 3', ulica: 'ul. Wiktora Brysza 3', miejscowosc: 'Zabrze', kod: '41-800', powiat: 'm. Zabrze', telefon: '32/271-38-61', liczba_miejsc: 59, profil_desc: 'osoby przewlekle somatycznie chore', prowadzacy: 'Miasto na prawach powiatu Zabrze', jst_nazwa: 'Miasto Zabrze' },
  { oficjalne_id: 40, nazwa: 'Dom Pomocy Społecznej nr 2', ulica: 'ul. Jaskółcza 11', miejscowosc: 'Zabrze', kod: '41-800', powiat: 'm. Zabrze', telefon: '32/271-48-54', liczba_miejsc: 69, profil_desc: 'osoby przewlekle somatycznie chore', prowadzacy: 'Miasto na prawach powiatu Zabrze', jst_nazwa: 'Miasto Zabrze' },
  { oficjalne_id: 41, nazwa: 'Dom Pomocy Społecznej prowadzony przez Zakon Kamilianów', ulica: 'ul. Cisowa 6', miejscowosc: 'Zabrze', kod: '41-800', powiat: 'm. Zabrze', telefon: '32/271-38-17', liczba_miejsc: 80, profil_desc: 'osoby przewlekle somatycznie chore', prowadzacy: 'Zakon Posługujący Chorym OO. Kamilianie', jst_nazwa: 'Miasto Zabrze' },
  // lp 42 — dwa obiekty: Pogórze (DI) + Kończyce Małe (filia, psychicznie chore)
  { oficjalne_id: 42, nazwa: 'Powiatowy Dom Pomocy Społecznej w Pogórzu', ulica: 'ul. Zamek 132', miejscowosc: 'Pogórze', kod: '43-430', powiat: 'cieszyński', telefon: '33/853-35-52', liczba_miejsc: 152, profil_desc: 'dorośli niepełnosprawni intelektualnie', prowadzacy: 'Powiat Cieszyński', jst_nazwa: 'Powiat Cieszyński' },
  { oficjalne_id: 42, nazwa: 'Powiatowy Dom Pomocy Społecznej w Pogórzu — Filia "Bursztyn"', ulica: 'ul. Staropolska 14', miejscowosc: 'Kończyce Małe', kod: '43-525', powiat: 'cieszyński', telefon: '32/469-35-71', liczba_miejsc: 32, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Powiat Cieszyński', jst_nazwa: 'Powiat Cieszyński' },
  { oficjalne_id: 43, nazwa: 'Dom Pomocy Społecznej "Wędrowiec"', ulica: 'ul. Księdza Jana Frenzla 204', miejscowosc: 'Bytom', kod: '41-923', powiat: 'm. Bytom', telefon: '32/280-60-35', liczba_miejsc: 46, profil_desc: 'dorośli niepełnosprawni intelektualnie', prowadzacy: 'Miasto na prawach powiatu Bytom', jst_nazwa: 'Miasto Bytom' },
  { oficjalne_id: 44, nazwa: 'Dom Pomocy Społecznej "Zameczek"', ulica: 'ul. Knurowska 13', miejscowosc: 'Kuźnia Nieborowska', kod: '44-144', powiat: 'gliwicki', telefon: '32/235-16-30', liczba_miejsc: 51, profil_desc: 'dorośli niepełnosprawni intelektualnie', prowadzacy: 'Powiat Gliwicki', jst_nazwa: 'Powiat Gliwicki' },
  { oficjalne_id: 45, nazwa: 'Dom Pomocy Społecznej w Orzeszu', ulica: 'ul. Traugutta 45', miejscowosc: 'Orzesze', kod: '43-180', powiat: 'mikołowski', telefon: '32/221-53-62', liczba_miejsc: 90, profil_desc: 'dorośli niepełnosprawni intelektualnie', prowadzacy: 'Powiat Mikołowski', jst_nazwa: 'Powiat Mikołowski' },
  { oficjalne_id: 46, nazwa: 'Dom Pomocy Społecznej w Miedarach', ulica: 'ul. Zamkowa 7', miejscowosc: 'Miedary', kod: '42-676', powiat: 'tarnogórski', telefon: '32/233-71-28', liczba_miejsc: 56, profil_desc: 'dorośli niepełnosprawni intelektualnie', prowadzacy: 'Powiat Tarnogórski', jst_nazwa: 'Powiat Tarnogórski' },
  { oficjalne_id: 47, nazwa: 'DPS dla Dorosłych prowadzony przez Zgromadzenie Sióstr Albertynek', ulica: 'ul. Wesoła 14', miejscowosc: 'Częstochowa', kod: '42-200', powiat: 'm. Częstochowa', telefon: '34/361-88-94', liczba_miejsc: 85, profil_desc: 'dorośli niepełnosprawni intelektualnie', prowadzacy: 'Zgromadzenie Sióstr Albertynek Posługujących Ubogim', jst_nazwa: 'Miasto Częstochowa' },
  { oficjalne_id: 48, nazwa: 'DPS dla Dorosłych prowadzony przez Zgromadzenie Braci Albertynów', ulica: 'ul. św. Jadwigi 84/86', miejscowosc: 'Częstochowa', kod: '42-200', powiat: 'm. Częstochowa', telefon: '34/374-06-67', liczba_miejsc: 82, profil_desc: 'dorośli niepełnosprawni intelektualnie', prowadzacy: 'Zgromadzenie Braci Albertynów', jst_nazwa: 'Miasto Częstochowa' },
  { oficjalne_id: 49, nazwa: 'DPS dla Dorosłych im. św. Brata Alberta', ulica: 'ul. Jasna 6', miejscowosc: 'Poraj', kod: '42-360', powiat: 'myszkowski', telefon: '34/314-50-18', liczba_miejsc: 100, profil_desc: 'dorośli niepełnosprawni intelektualnie', prowadzacy: 'Zgromadzenie Sióstr Albertynek Posługujących Ubogim', jst_nazwa: 'Powiat Myszkowski' },
  { oficjalne_id: 50, nazwa: 'DPS prowadzony przez Zgromadzenie Sióstr Miłosierdzia św. Karola Boromeusza', ulica: 'ul. Maciejkowicka 8', miejscowosc: 'Siemianowice Śląskie', kod: '41-103', powiat: 'm. Siemianowice Śląskie', telefon: '32/228-12-08', liczba_miejsc: 44, profil_desc: 'dorośli niepełnosprawni intelektualnie', prowadzacy: 'Zgromadzenie Sióstr Miłosierdzia św. Karola Boromeusza', jst_nazwa: 'Miasto Siemianowice Śląskie' },
  { oficjalne_id: 51, nazwa: 'Caritas Archidiecezji Katowickiej DPS Święty Antoni', ulica: 'ul. ks. bpa. Kubiny 11', miejscowosc: 'Świętochłowice', kod: '41-600', powiat: 'm. Świętochłowice', telefon: '32/245-27-35', liczba_miejsc: 78, profil_desc: 'dorośli niepełnosprawni intelektualnie', prowadzacy: 'Caritas Archidiecezji Katowickiej', jst_nazwa: 'Miasto Świętochłowice' },
  { oficjalne_id: 52, nazwa: 'DPS prowadzony przez Ojców Kamilianów', ulica: 'ul. Wolności 34', miejscowosc: 'Zbrosławice', kod: '42-674', powiat: 'tarnogórski', telefon: '32/233-70-42', liczba_miejsc: 95, profil_desc: 'dorośli niepełnosprawni intelektualnie', prowadzacy: 'Zakon Posługujący Chorym OO. Kamilianie', jst_nazwa: 'Powiat Tarnogórski' },
  { oficjalne_id: 53, nazwa: 'Caritas Archidiecezji Katowickiej Ośrodek M.B Uzdrowienie Chorych Dom Pomocy Społecznej w Knurowie', ulica: 'ul. Szpitalna 29', miejscowosc: 'Knurów', kod: '44-194', powiat: 'gliwicki', telefon: '32/336-22-33', liczba_miejsc: 90, profil_desc: 'dorośli niepełnosprawni intelektualnie', prowadzacy: 'Caritas Archidiecezji Katowickiej', jst_nazwa: 'Powiat Gliwicki' },
  { oficjalne_id: 54, nazwa: 'Powiatowy Dom Pomocy Społecznej "Feniks"', ulica: 'ul. Sportowa 13', miejscowosc: 'Skoczów', kod: '43-430', powiat: 'cieszyński', telefon: '33/853-36-40', liczba_miejsc: 96, profil_desc: 'dorośli niepełnosprawni intelektualnie', prowadzacy: 'Powiat Cieszyński', jst_nazwa: 'Powiat Cieszyński' },
  { oficjalne_id: 55, nazwa: 'Dom Pomocy Społecznej "Republika"', ulica: 'ul. Michałkowicka 4', miejscowosc: 'Chorzów', kod: '41-500', powiat: 'm. Chorzów', telefon: '32/245-90-65', liczba_miejsc: 97, profil_desc: 'dorośli niepełnosprawni intelektualnie oraz dzieci i młodzież niepełnosprawna intelektualnie', prowadzacy: 'Miasto na prawach powiatu Chorzów', jst_nazwa: 'Miasto Chorzów' },
  { oficjalne_id: 56, nazwa: 'Dom Pomocy Społecznej "Ostoja"', ulica: 'ul. Kozielska 1', miejscowosc: 'Sośnicowice', kod: '44-153', powiat: 'gliwicki', telefon: '32/238-75-42', liczba_miejsc: 124, profil_desc: 'dorośli niepełnosprawni intelektualnie oraz dzieci i młodzież niepełnosprawna intelektualnie', prowadzacy: 'Powiat Gliwicki', jst_nazwa: 'Powiat Gliwicki' },
  { oficjalne_id: 57, nazwa: 'Dom Pomocy Społecznej "Zameczek"', ulica: 'ul. 74 Górnosląskiego Pułku Piechoty 2', miejscowosc: 'Lubliniec', kod: '42-700', powiat: 'lubliniecki', telefon: '34/353-11-12', liczba_miejsc: 73, profil_desc: 'dorośli niepełnosprawni intelektualnie oraz dzieci i młodzież niepełnosprawna intelektualnie', prowadzacy: 'Powiat Lubliniecki', jst_nazwa: 'Powiat Lubliniecki' },
  { oficjalne_id: 58, nazwa: 'Dom Pomocy Społecznej Zgromadzenia Córek Bożej Miłości', ulica: 'ul. Żywiecka 20', miejscowosc: 'Bielsko-Biała', kod: '43-300', powiat: 'm. Bielsko-Biała', telefon: '33/816-39-93', liczba_miejsc: 65, profil_desc: 'dorośli niepełnosprawni intelektualnie oraz dzieci i młodzież niepełnosprawna intelektualnie', prowadzacy: 'Prowincja Polska Zgromadzenia Córek Bożej Miłości', jst_nazwa: 'Miasto Bielsko-Biała' },
  { oficjalne_id: 59, nazwa: 'DPS Zgromadzenia Sióstr Służebniczek BDNP', ulica: 'ul. Mickiewicza 36', miejscowosc: 'Skoczów', kod: '43-430', powiat: 'cieszyński', telefon: '33/853-37-74', liczba_miejsc: 39, profil_desc: 'dorośli niepełnosprawni intelektualnie oraz dzieci i młodzież niepełnosprawna intelektualnie', prowadzacy: 'Zgromadzenie Sióstr Służebniczek BDNP Prowincja Krakowska', jst_nazwa: 'Powiat Cieszyński' },
  { oficjalne_id: 60, nazwa: 'DPS dla Dzieci prowadzony przez Zgromadzenie Sióstr Szkolnych de Notre Dame', ulica: 'ul. 1 Maja 12', miejscowosc: 'Strumień', kod: '43-246', powiat: 'cieszyński', telefon: '33/857-02-50', liczba_miejsc: 73, profil_desc: 'dzieci i młodzież niepełnosprawna intelektualnie', prowadzacy: 'Zgromadzenie Sióstr Szkolnych de Notre Dame Prowincja Polska', jst_nazwa: 'Powiat Cieszyński' },
  { oficjalne_id: 61, nazwa: 'DPS dla dzieci i młodzieży niepełnosprawnych intelektualnie prowadzony przez Zakon Ojców Kamilianów', ulica: 'ul. Damrota 7', miejscowosc: 'Pilchowice', kod: '44-145', powiat: 'gliwicki', telefon: '32/235-65-26', liczba_miejsc: 60, profil_desc: 'dzieci i młodzież niepełnosprawna intelektualnie', prowadzacy: 'Zakon Posługujący Chorym OO. Kamilianie', jst_nazwa: 'Powiat Gliwicki' },
  { oficjalne_id: 62, nazwa: 'DPS prowadzony przez Zgromadzenie Sióstr św. Jadwigi', ulica: 'ul. Golasowicka 15', miejscowosc: 'Pielgrzymowice', kod: '43-253', powiat: 'pszczyński', telefon: '32/472-30-07', liczba_miejsc: 90, profil_desc: 'dzieci i młodzież niepełnosprawna intelektualnie', prowadzacy: 'Zgromadzenie Sióstr św. Jadwigi Prowincja Katowicka', jst_nazwa: 'Powiat Pszczyński' },
  { oficjalne_id: 63, nazwa: 'DPS "Różany Pałac" prowadzony przez Zgromadzenie Sióstr Franciszkanek Maryi Nieustającej Pomocy', ulica: 'ul. Kolejowa 4', miejscowosc: 'Krzyżanowice', kod: '47-450', powiat: 'raciborski', telefon: '32/419-40-20', liczba_miejsc: 60, profil_desc: 'dorośli niepełnosprawni intelektualnie oraz dzieci i młodzież niepełnosprawna intelektualnie', prowadzacy: 'Zgromadzenie Sióstr Franciszkanek Maryi Nieustającej Pomocy', jst_nazwa: 'Powiat Raciborski' },
  { oficjalne_id: 64, nazwa: 'DPS prowadzony przez Zgromadzenie Sióstr Miłosierdzia św. Karola Boromeusza w Nakle Śląskim', ulica: 'ul. Główna 8', miejscowosc: 'Nakło Śląskie', kod: '42-620', powiat: 'tarnogórski', telefon: '32/284-32-34', liczba_miejsc: 60, profil_desc: 'dorośli niepełnosprawni intelektualnie oraz dzieci i młodzież niepełnosprawna intelektualnie', prowadzacy: 'Zgromadzenie Sióstr Miłosierdzia św. Karola Boromeusza', jst_nazwa: 'Powiat Tarnogórski' },
  { oficjalne_id: 65, nazwa: 'DPS Zgromadzenia Sióstr Opatrzności Bożej', ulica: 'ul. Wolności 35', miejscowosc: 'Wodzisław Śląski', kod: '41-300', powiat: 'wodzisławski', telefon: '32/455-10-30', liczba_miejsc: 56, profil_desc: 'dorośli niepełnosprawni intelektualnie oraz dzieci i młodzież niepełnosprawna intelektualnie', prowadzacy: 'Zgromadzenie Sióstr Opatrzności Bożej', jst_nazwa: 'Powiat Wodzisławski' },
  { oficjalne_id: 66, nazwa: 'Dom Pomocy Społecznej Najświętsze Serce Jezusa', ulica: 'ul. Kłodnicka 103', miejscowosc: 'Ruda Śląska', kod: '41-706', powiat: 'm. Ruda Śląska', telefon: '32/243-34-84', liczba_miejsc: 95, profil_desc: 'dorośli niepełnosprawni intelektualnie oraz dzieci i młodzież niepełnosprawna intelektualnie', prowadzacy: 'Ośrodek dla Osób Niepełnosprawnych Najświętsze Serce Jezusa', jst_nazwa: 'Miasto Ruda Śląska' },
  { oficjalne_id: 67, nazwa: 'Dom Pomocy Społecznej', ulica: 'ul. Mickiewicza 2', miejscowosc: 'Będzin', kod: '42-506', powiat: 'będziński', telefon: '32/267-35-38', liczba_miejsc: 100, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Powiat Będziński', jst_nazwa: 'Powiat Będziński' },
  { oficjalne_id: 68, nazwa: 'Dom Pomocy Społecznej dla Dorosłych', ulica: 'ul. Dworcowa 7', miejscowosc: 'Bytom', kod: '41-902', powiat: 'm. Bytom', telefon: '32/281-41-23', liczba_miejsc: 135, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Miasto na prawach powiatu Bytom', jst_nazwa: 'Miasto Bytom' },
  { oficjalne_id: 69, nazwa: 'Dom Pomocy Społecznej w Blachowni', ulica: 'ul. Sienkiewicza 6', miejscowosc: 'Blachownia', kod: '42-290', powiat: 'częstochowski', telefon: '34/327-03-76', liczba_miejsc: 158, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Powiat Częstochowski', jst_nazwa: 'Powiat Częstochowski' },
  { oficjalne_id: 70, nazwa: 'Dom Pomocy Społecznej', ulica: 'ul. Szczekocińska 19', miejscowosc: 'Lelów', kod: '42-235', powiat: 'częstochowski', telefon: '34/355-82-97', liczba_miejsc: 100, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Powiat Częstochowski', jst_nazwa: 'Powiat Częstochowski' },
  { oficjalne_id: 71, nazwa: 'Dom Pomocy Społecznej', ulica: 'ul. Kontkiewicza 2', miejscowosc: 'Częstochowa', kod: '42-200', powiat: 'm. Częstochowa', telefon: '34/364-38-15', liczba_miejsc: 192, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Miasto na prawach powiatu Częstochowa', jst_nazwa: 'Miasto Częstochowa' },
  // lp 72 — dwa obiekty: Lubliniec główny + Filia Koszęcin
  { oficjalne_id: 72, nazwa: 'Dom Pomocy Społecznej', ulica: 'ul. Kochcicka 14', miejscowosc: 'Lubliniec', kod: '42-700', powiat: 'lubliniecki', telefon: '34/356-32-66', liczba_miejsc: 245, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Powiat Lubliniecki', jst_nazwa: 'Powiat Lubliniecki' },
  { oficjalne_id: 72, nazwa: 'Dom Pomocy Społecznej — Filia Koszęcin', ulica: 'ul. Dąbrówki 1', miejscowosc: 'Koszęcin', kod: '42-286', powiat: 'lubliniecki', telefon: '34/357-62-11', liczba_miejsc: 33, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Powiat Lubliniecki', jst_nazwa: 'Powiat Lubliniecki' },
  { oficjalne_id: 73, nazwa: 'Dom Pomocy Społecznej', ulica: 'ul. Reja 54', miejscowosc: 'Mysłowice', kod: '41-404', powiat: 'm. Mysłowice', telefon: '32/222-21-01', liczba_miejsc: 50, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Miasto na prawach powiatu Mysłowice', jst_nazwa: 'Miasto Mysłowice' },
  { oficjalne_id: 74, nazwa: 'Dom Pomocy Społecznej', ulica: 'ul. Trautmana 4', miejscowosc: 'Piekary Śląskie', kod: '41-946', powiat: 'm. Piekary Śląskie', telefon: '32/287-92-63', liczba_miejsc: 130, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Miasto Piekary Śląskie', jst_nazwa: 'Miasto Piekary Śląskie' },
  { oficjalne_id: 75, nazwa: 'Dom Pomocy Społecznej p.w. św. Józefa', ulica: 'ul. Rybnicka 7', miejscowosc: 'Lyski', kod: '44-295', powiat: 'rybnicki', telefon: '32/430-00-06', liczba_miejsc: 124, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Powiat Rybnicki', jst_nazwa: 'Powiat Rybnicki' },
  { oficjalne_id: 76, nazwa: 'Dom Pomocy Społecznej', ulica: 'ul. Rzemieślnicza 9', miejscowosc: 'Zawiercie', kod: '42-400', powiat: 'zawierciański', telefon: '32/672-15-73', liczba_miejsc: 162, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Powiat Zawierciański', jst_nazwa: 'Powiat Zawierciański' },
  { oficjalne_id: 77, nazwa: 'DPS Konwentu Bonifratrów w Cieszynie', ulica: 'pl. ks. J. Londzina 1', miejscowosc: 'Cieszyn', kod: '43-400', powiat: 'cieszyński', telefon: '33/852-02-68', liczba_miejsc: 116, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Konwent Zakonu Bonifratrów w Cieszynie', jst_nazwa: 'Powiat Cieszyński' },
  { oficjalne_id: 78, nazwa: 'DPS prowadzony przez Zgromadzenie Sióstr Miłosierdzia św. Karola Boromeusza', ulica: 'ul. Warowna 59', miejscowosc: 'Pszczyna', kod: '43-200', powiat: 'pszczyński', telefon: '32/210-45-81', liczba_miejsc: 70, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Zgromadzenie Sióstr Miłosierdzia św. Karola Boromeusza', jst_nazwa: 'Powiat Pszczyński' },
  { oficjalne_id: 79, nazwa: 'DPS prowadzony przez SS Maryi Niepokalanej', ulica: 'pl. Jagiełły 3', miejscowosc: 'Racibórz', kod: '47-400', powiat: 'raciborski', telefon: '32/415-46-27', liczba_miejsc: 170, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Zgromadzenie Sióstr Maryi Niepokalanej Prowincja Polska', jst_nazwa: 'Powiat Raciborski' },
  { oficjalne_id: 80, nazwa: 'DPS dla Osób Przewlekle Psychicznie Chorych', ulica: 'ul. Oddziałów Młodzieży Powstańczej 3', miejscowosc: 'Ruda Śląska', kod: '41-707', powiat: 'm. Ruda Śląska', telefon: '32/242-86-01', liczba_miejsc: 45, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Zgromadzenie Sióstr Miłosierdzia św. Karola Boromeusza', jst_nazwa: 'Miasto Ruda Śląska' },
  { oficjalne_id: 81, nazwa: 'Dom Pomocy Społecznej', ulica: 'ul. św. Barbary 5', miejscowosc: 'Siemianowice Śląskie', kod: '41-100', powiat: 'm. Siemianowice Śląskie', telefon: '32/228-21-03', liczba_miejsc: 90, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Zgromadzenie Sióstr Miłosierdzia św. Karola Boromeusza', jst_nazwa: 'Miasto Siemianowice Śląskie' },
  { oficjalne_id: 82, nazwa: 'DPS dla Osób Przewlekle Psychicznie Chorych prowadzony przez Zgromadzenie SS Boromeuszek', ulica: 'ul. Gliwicka 22', miejscowosc: 'Tarnowskie Góry', kod: '42-600', powiat: 'tarnogórski', telefon: '32/285-37-85', liczba_miejsc: 62, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Zgromadzenie Sióstr Miłosierdzia św. Karola Boromeusza', jst_nazwa: 'Powiat Tarnogórski' },
  { oficjalne_id: 83, nazwa: 'Dom Pomocy Społecznej "Słoneczny Dom"', ulica: 'ul. Knurowska 17', miejscowosc: 'Zabrze', kod: '41-800', powiat: 'm. Zabrze', telefon: '32/733-75-47', liczba_miejsc: 90, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Champion Sp. z o.o.', jst_nazwa: 'Miasto Zabrze' },
  { oficjalne_id: 84, nazwa: 'Ośrodek dla Osób Niepełnosprawnych Miłosierdzie Boże Dom Pomocy Społecznej', ulica: 'ul. Gliwicka 366', miejscowosc: 'Mikołów', kod: '43-190', powiat: 'mikołowski', telefon: '32/322-53-35', liczba_miejsc: 93, profil_desc: 'osoby niepełnosprawne fizycznie', prowadzacy: 'Ośrodek dla Osób Niepełnosprawnych Miłosierdzie Boże', jst_nazwa: 'Powiat Mikołowski' },
  { oficjalne_id: 85, nazwa: 'Ośrodek dla Osób Niepełnosprawnych Miłosierdzie Boże Dom Pomocy Społecznej A', ulica: 'ul. Gliwicka 366', miejscowosc: 'Mikołów', kod: '43-190', powiat: 'mikołowski', telefon: '32/322-53-35', liczba_miejsc: 63, profil_desc: 'osoby niepełnosprawne fizycznie', prowadzacy: 'Ośrodek dla Osób Niepełnosprawnych Miłosierdzie Boże', jst_nazwa: 'Powiat Mikołowski' },
  { oficjalne_id: 86, nazwa: 'Polski Związek Niewidomych Dom Pomocy Społecznej im. Kazimierza Jaworka w Chorzowie', ulica: 'ul. Siemianowicka 101', miejscowosc: 'Chorzów', kod: '41-503', powiat: 'm. Chorzów', telefon: '32/241-10-61', liczba_miejsc: 160, profil_desc: 'osoby niepełnosprawne fizycznie', prowadzacy: 'Polski Związek Niewidomych', jst_nazwa: 'Miasto Chorzów' },
  { oficjalne_id: 87, nazwa: 'Dom Pomocy Społecznej Pod Aniołem', ulica: 'ul. Kościelna 34', miejscowosc: 'Tarnowskie Góry', kod: '42-609', powiat: 'tarnogórski', telefon: '32/50 65 280', liczba_miejsc: 80, profil_desc: 'osoby przewlekle psychicznie chore', prowadzacy: 'Powiat Tarnogórski', jst_nazwa: 'Powiat Tarnogórski' },

  // ===== SEKCJA 2: MIEJSKIE (lp M1-M9) =====
  { oficjalne_id: 'M1', nazwa: 'Miejski Dom Pomocy Społecznej', ulica: 'ul. Żużlowa 25', miejscowosc: 'Rybnik', kod: '44-200', powiat: 'm. Rybnik', telefon: '32/422-36-06', liczba_miejsc: 150, profil_desc: 'osoby w podeszłym wieku oraz osoby przewlekle somatycznie chore', prowadzacy: 'Miasto Rybnik', jst_nazwa: 'Miasto Rybnik' },
  { oficjalne_id: 'M2', nazwa: 'Miejski Dom Pomocy Społecznej "Złota Jesień"', ulica: 'ul. Imieli 12', miejscowosc: 'Świętochłowice', kod: '41-605', powiat: 'm. Świętochłowice', telefon: '32/771-04-50', liczba_miejsc: 63, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Miasto Świętochłowice', jst_nazwa: 'Miasto Świętochłowice' },
  { oficjalne_id: 'M3', nazwa: 'Dom Pomocy Społecznej "Dar Serca"', ulica: 'ul. Kaszubska 6', miejscowosc: 'Jastrzębie-Zdrój', kod: '44-335', powiat: 'm. Jastrzębie-Zdrój', telefon: '32/471-96-22', liczba_miejsc: 37, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Miasto Jastrzębie Zdrój', jst_nazwa: 'Miasto Jastrzębie-Zdrój' },
  { oficjalne_id: 'M4', nazwa: 'Dom Pomocy Społecznej "Złota Jesień"', ulica: 'ul. Zacisze 28', miejscowosc: 'Czechowice-Dziedzice', kod: '43-502', powiat: 'bielski', telefon: '32/215-81-72', liczba_miejsc: 30, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Miasto Czechowice-Dziedzice', jst_nazwa: 'Miasto Czechowice-Dziedzice' },
  { oficjalne_id: 'M5', nazwa: 'Dom Spokojnej Starości', ulica: 'ul. Mickiewicza 13', miejscowosc: 'Cieszyn', kod: '43-400', powiat: 'cieszyński', telefon: '33/858-02-39', liczba_miejsc: 65, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Miasto Cieszyn', jst_nazwa: 'Miasto Cieszyn' },
  { oficjalne_id: 'M6', nazwa: 'Miejski Dom Spokojnej Starości', ulica: 'ul. Słoneczna 10', miejscowosc: 'Ustroń', kod: '43-450', powiat: 'cieszyński', telefon: '33/854-12-15', liczba_miejsc: 38, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Miasto Ustroń', jst_nazwa: 'Miasto Ustroń' },
  { oficjalne_id: 'M7', nazwa: 'Miejski Dom Pomocy Społecznej w Żorach', ulica: 'oś. Powstańców Śląskich 20', miejscowosc: 'Żory', kod: '44-240', powiat: 'm. Żory', telefon: '32/434-22-50', liczba_miejsc: 26, profil_desc: 'osoby w podeszłym wieku oraz osoby niepełnosprawne fizycznie', prowadzacy: 'Miasto Żory', jst_nazwa: 'Miasto Żory' },
  { oficjalne_id: 'M8', nazwa: 'Dom Pomocy Społecznej "Senior" im. Jana Kaczmarka', ulica: 'ul. Szpitalna 5a', miejscowosc: 'Czeladź', kod: '41-250', powiat: 'będziński', telefon: '32/265-94-00', liczba_miejsc: 48, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Miasto Czeladź', jst_nazwa: 'Miasto Czeladź' },
  { oficjalne_id: 'M9', nazwa: 'Dom Pomocy Społecznej dla osób w podeszłym wieku w Herbach', ulica: 'ul. Mickiewicza 19a', miejscowosc: 'Herby', kod: '42-284', powiat: 'kłobucki', telefon: '34/357-40-76', liczba_miejsc: 14, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Gmina Herby', jst_nazwa: 'Gmina Herby' },

  // ===== SEKCJA 3: BEZ ZLECENIA (lp B1-B6) =====
  { oficjalne_id: 'B1', nazwa: 'Ewangelicki Dom Pomocy Społecznej "Soar"', ulica: 'ul. Modrzewskiego 25', miejscowosc: 'Bielsko-Biała', kod: '43-300', powiat: 'm. Bielsko-Biała', telefon: '33/812-61-64', liczba_miejsc: 31, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Parafia Ewangelicko-Augsburska w Bielsku-Białej', jst_nazwa: null },
  { oficjalne_id: 'B2', nazwa: 'Dom Pomocy Społecznej w Drużykowej', ulica: 'Drużykowa 16', miejscowosc: 'Szczekociny', kod: '42-455', powiat: 'zawierciański', telefon: '34/355-96-86', liczba_miejsc: 73, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Stowarzyszenie Wspierania Inicjatyw Charytatywnych im. Matki Teresy z Kalkuty', jst_nazwa: null },
  { oficjalne_id: 'B3', nazwa: 'Dom Pomocy Społecznej Matki Bożej Nieustającej Pomocy', ulica: 'ul. Grzybowa 8', miejscowosc: 'Bielsko-Biała', kod: '43-300', powiat: 'm. Bielsko-Biała', telefon: '33/817-22-98', liczba_miejsc: 28, profil_desc: 'osoby w podeszłym wieku', prowadzacy: 'Stowarzyszenie — Klub Inteligencji Katolickiej im. św. Józefa', jst_nazwa: null },
  { oficjalne_id: 'B4', nazwa: 'Ośrodek Mieszkalno-Rehabilitacyjny im. Św. Ap. Józefa Bilczewskiego Stowarzyszenia "Razem"', ulica: 'ul. Gen. Sikorskiego 48A', miejscowosc: 'Bestwina', kod: '43-512', powiat: 'bielski', telefon: '33/443-20-31', liczba_miejsc: 22, profil_desc: 'dorośli niepełnosprawni intelektualnie', prowadzacy: 'Stowarzyszenie Na Rzecz Osób z Upośledzeniem Umysłowym "Razem"', jst_nazwa: null },
  { oficjalne_id: 'B5', nazwa: 'Dom Pomocy Społecznej Domus Misericordiae', ulica: 'ul. Ogrodowa 28', miejscowosc: 'Częstochowa', kod: '42-202', powiat: 'm. Częstochowa', telefon: '506-394-667', liczba_miejsc: 32, profil_desc: 'osoby w podeszłym wieku oraz osoby przewlekle somatycznie chore', prowadzacy: 'Caritas Archidiecezji Częstochowskiej', jst_nazwa: null },
  { oficjalne_id: 'B6', nazwa: 'Dom Pomocy Społecznej w Bystrej', ulica: 'ul. Klimczoka 80', miejscowosc: 'Bystra', kod: '43-360', powiat: 'bielski', telefon: '33/817-12-12', liczba_miejsc: 100, profil_desc: 'osoby w podeszłym wieku oraz osoby przewlekle somatycznie chore', prowadzacy: 'Fundacja Klimczok z siedzibą w Bystrej', jst_nazwa: null },
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function geocode(ulica, miejscowosc, kod) {
  return new Promise((resolve) => {
    const query = encodeURIComponent(`${ulica}, ${miejscowosc}, ${kod}, Polska`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=pl`;
    const options = { headers: { 'User-Agent': 'geocoder-research/1.0' } };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results.length > 0) {
            resolve({ lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) });
          } else {
            resolve(null);
          }
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function main() {
  console.log(`📋 DPS Śląskie do importu: ${DPS_SLASKIE.length}`);

  // Pobierz istniejące śląskie DPS żeby pominąć duplikaty
  const existing = await prisma.placowka.findMany({
    where: { wojewodztwo: 'śląskie', typ_placowki: 'DPS' },
    select: { ulica: true, miejscowosc: true }
  });
  const existingKeys = new Set(existing.map(p => `${(p.ulica||'').toLowerCase().trim()}|${p.miejscowosc.toLowerCase().trim()}`));
  console.log(`   Już w bazie (śląskie DPS): ${existing.length}`);

  let imported = 0, skipped = 0, failed = 0;

  for (const dps of DPS_SLASKIE) {
    const key = `${(dps.ulica||'').toLowerCase().trim()}|${dps.miejscowosc.toLowerCase().trim()}`;
    if (existingKeys.has(key)) {
      console.log(`⏭️  Pominam (już w bazie): ${dps.miejscowosc} — ${dps.ulica}`);
      skipped++;
      continue;
    }

    process.stdout.write(`🔍 Geocoding: ${dps.ulica}, ${dps.miejscowosc}...`);
    await sleep(NOMINATIM_DELAY);
    const geo = await geocode(dps.ulica, dps.miejscowosc, dps.kod);

    if (!geo) {
      console.log(` ❌ brak wyników`);
      failed++;
    } else {
      console.log(` ✅ ${geo.lat.toFixed(4)}, ${geo.lon.toFixed(4)}`);
    }

    await prisma.placowka.create({
      data: {
        nazwa: dps.nazwa,
        typ_placowki: 'DPS',
        prowadzacy: dps.prowadzacy || null,
        ulica: dps.ulica,
        miejscowosc: dps.miejscowosc,
        kod_pocztowy: dps.kod,
        powiat: dps.powiat,
        wojewodztwo: 'śląskie',
        telefon: dps.telefon || null,
        liczba_miejsc: dps.liczba_miejsc || null,
        profil_opieki: mapProfil(dps.profil_desc),
        latitude: geo?.lat || null,
        longitude: geo?.lon || null,
        jst_nazwa: dps.jst_nazwa || null,
        oficjalne_id: typeof dps.oficjalne_id === 'number' ? dps.oficjalne_id : null,
        verified: false,
        zrodlo_dane: 'Rejestr DPS Śląskiego (katowice.uw.gov.pl, aktualizacja 12.03.2026)',
      }
    });
    imported++;
  }

  console.log(`\n✅ Gotowe!`);
  console.log(`   Zaimportowano: ${imported}`);
  console.log(`   Pominięto (duplikaty): ${skipped}`);
  console.log(`   Bez geocodingu: ${failed}`);

  const total = await prisma.placowka.count({ where: { wojewodztwo: 'śląskie', typ_placowki: 'DPS' } });
  console.log(`   Łącznie śląskich DPS w bazie: ${total}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
