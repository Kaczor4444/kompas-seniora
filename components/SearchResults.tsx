"use client";

import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Search, MapPin, Filter } from "lucide-react";
import {
  getProfileOpiekiNazwy,
  profileOpiekiKody,
} from "@/src/data/profileopieki";
import { formatDistance } from "@/src/utils/distance";
import FavoriteButton from "@/src/components/FavoriteButton";

const FacilityMap = dynamic(() => import("@/components/FacilityMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" />
  ),
});

interface Facility {
  id: number;
  nazwa: string;
  typ_placowki: string;
  powiat: string;
  miejscowosc: string;
  koszt_pobytu: number | null;
  telefon: string | null;
  latitude: number | null;
  longitude: number | null;
  profil_opieki?: string | null;
  distance?: number | null;
}

interface ActiveFilters {
  wojewodztwo?: string;
  powiat?: string;
  type?: string;
  careTypes?: string[];
  minPrice?: number;
  maxPrice?: number;
  showFree?: boolean;
}

interface SearchResultsProps {
  query: string;
  type: string;
  results: Facility[];
  message: string;
  activeFilters?: ActiveFilters;
  userLocation?: { lat: number; lng: number };
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

const emptyStateVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function SearchResults({
  query,
  type,
  results,
  message,
  activeFilters,
  userLocation,
}: SearchResultsProps) {
  const router = useRouter();

  const removeFilter = (filterType: string, value?: string) => {
    const params = new URLSearchParams(window.location.search);

    switch (filterType) {
      case "wojewodztwo":
        params.delete("woj");
        params.delete("powiat");
        break;
      case "powiat":
        params.delete("powiat");
        break;
      case "type":
        params.delete("type");
        break;
      case "care":
        if (value && activeFilters?.careTypes) {
          const remaining = activeFilters.careTypes.filter((t) => t !== value);
          if (remaining.length > 0) {
            params.set("care", remaining.join(","));
          } else {
            params.delete("care");
          }
        } else {
          params.delete("care");
        }
        break;
      case "price":
        params.delete("min");
        params.delete("max");
        break;
      case "free":
        params.delete("free");
        break;
    }

    router.push(`/search?${params.toString()}`);

    // Toast notification
    toast.success("Filtr usunięty", {
      duration: 2000,
      icon: "✓",
    });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");

    if (query) {
      router.push(`/search?q=${query}`);
    } else {
      router.push("/search");
    }
  };

  const wojewodztwaLabels: Record<string, string> = {
    malopolskie: "Małopolskie",
    slaskie: "Śląskie",
    all: "Wszystkie",
  };

  const typeLabels: Record<string, string> = {
    dps: "DPS",
    sds: "ŚDS",
    all: "Wszystkie",
  };

  const hasActiveFilters =
    activeFilters &&
    (activeFilters.wojewodztwo ||
      activeFilters.powiat ||
      activeFilters.type ||
      (activeFilters.careTypes && activeFilters.careTypes.length > 0) ||
      activeFilters.minPrice ||
      activeFilters.maxPrice ||
      activeFilters.showFree);

  return (
    <>
      {/* Message */}
      <AnimatePresence>
        {message && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <p className="text-sm sm:text-base text-blue-800 leading-relaxed">
              {message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white border border-neutral-200 rounded-lg overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs sm:text-sm text-gray-600 font-medium mr-1">
                Aktywne filtry:
              </span>

              <AnimatePresence>
                {activeFilters?.wojewodztwo && (
                  <motion.button
                    variants={badgeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    onClick={() => removeFilter("wojewodztwo")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors min-h-[44px] touch-manipulation"
                  >
                    {wojewodztwaLabels[activeFilters.wojewodztwo] ||
                      activeFilters.wojewodztwo}
                    <span className="text-accent-600 text-lg">×</span>
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {activeFilters?.powiat && (
                  <motion.button
                    variants={badgeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    onClick={() => removeFilter("powiat")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors min-h-[44px] touch-manipulation"
                  >
                    Powiat: {activeFilters.powiat}
                    <span className="text-accent-600 text-lg">×</span>
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {activeFilters?.type && activeFilters.type !== "all" && (
                  <motion.button
                    variants={badgeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    onClick={() => removeFilter("type")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors min-h-[44px] touch-manipulation"
                  >
                    Typ: {typeLabels[activeFilters.type] || activeFilters.type}
                    <span className="text-accent-600 text-lg">×</span>
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {activeFilters?.careTypes &&
                  activeFilters.careTypes.map((care) => {
                    const careLabel =
                      profileOpiekiKody[care as keyof typeof profileOpiekiKody];
                    return (
                      <motion.button
                        key={care}
                        variants={badgeVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.2 }}
                        onClick={() => removeFilter("care", care)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors min-h-[44px] touch-manipulation"
                      >
                        {careLabel || care}
                        <span className="text-accent-600 text-lg">×</span>
                      </motion.button>
                    );
                  })}
              </AnimatePresence>

              <AnimatePresence>
                {(activeFilters?.minPrice || activeFilters?.maxPrice) && (
                  <motion.button
                    variants={badgeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    onClick={() => removeFilter("price")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors min-h-[44px] touch-manipulation"
                  >
                    <span className="text-xs sm:text-sm">
                      {activeFilters.minPrice && activeFilters.maxPrice
                        ? `${activeFilters.minPrice.toLocaleString()} - ${activeFilters.maxPrice.toLocaleString()} zł`
                        : activeFilters.minPrice
                        ? `Od ${activeFilters.minPrice.toLocaleString()} zł`
                        : `Do ${activeFilters.maxPrice?.toLocaleString()} zł`}
                    </span>
                    <span className="text-accent-600 text-lg">×</span>
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {activeFilters?.showFree && (
                  <motion.button
                    variants={badgeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    onClick={() => removeFilter("free")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors min-h-[44px] touch-manipulation"
                  >
                    Tylko bezpłatne
                    <span className="text-accent-600 text-lg">×</span>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Clear All Button */}
              {hasActiveFilters && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  onClick={clearAllFilters}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors min-h-[44px] touch-manipulation font-medium"
                >
                  Wyczyść wszystkie
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile: Fullscreen Map View (hidden by default) */}
      <div
        id="mobile-map-view"
        className="lg:hidden fixed inset-0 top-[120px] z-20 bg-white hidden"
      >
        <FacilityMap facilities={results} mode="multiple" />
      </div>

      {/* Mobile + Desktop: List View (wrapper with ID) */}
      <div id="mobile-list-view" className="lg:block">
        {results.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Lista placówek */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              <AnimatePresence mode="popLayout">
                {results.map((facility, index) => {
                  const profileNazwy = facility.profil_opieki
                    ? getProfileOpiekiNazwy(facility.profil_opieki)
                    : [];

                  return (
                    <motion.div
                      key={facility.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{
                        duration: 0.4,
                        delay: index * 0.05,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      whileHover={{
                        scale: 1.01,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                      }}
                      className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 transition relative"
                    >
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 leading-snug pr-20 sm:pr-32">
                        {facility.nazwa}
                      </h2>
                      {/* Favorite Button - top right corner */}
                      <div className="absolute top-4 right-4 z-10">
                        <FavoriteButton
                          facility={{
                            id: facility.id,
                            nazwa: facility.nazwa,
                            miejscowosc: facility.miejscowosc,
                            powiat: facility.powiat,
                            typ_placowki: facility.typ_placowki,
                            koszt_pobytu: facility.koszt_pobytu,
                            telefon: facility.telefon,
                          }}
                          variant="icon-only"
                        />
                      </div>

                      {/* Distance Badge - inline */}
                      {facility.distance !== null &&
                        facility.distance !== undefined && (
                          <div className="inline-flex items-center gap-1 mb-4 px-2 py-1 bg-accent-50 text-gray-700 rounded-full text-xs font-medium">
                            <Compass className="w-3.5 h-3.5" />
                            <span>
                              {formatDistance(facility.distance)} od Ciebie
                            </span>
                          </div>
                        )}
                      {!facility.distance && <div className="mb-4"></div>}

                      <div className="space-y-3 sm:space-y-2 mb-4">
                        <div>
                          <span className="font-medium text-gray-700 text-sm sm:text-base">
                            Lokalizacja
                          </span>
                          <p className="text-sm sm:text-base text-gray-600 mt-0.5">
                            {facility.miejscowosc}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Powiat: {facility.powiat}
                          </p>
                        </div>

                        {profileNazwy.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700 text-sm sm:text-base">
                              Profil opieki
                            </span>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {profileNazwy.map((nazwa, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block px-2 py-1 text-xs bg-accent-50 text-accent-700 rounded-md"
                                >
                                  {nazwa}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <span className="font-medium text-gray-700 text-sm sm:text-base">
                            Koszt miesięczny
                          </span>
                          <p
                            className={`text-xl sm:text-lg font-semibold mt-0.5 ${
                              facility.koszt_pobytu
                                ? "text-accent-600"
                                : "text-green-600"
                            }`}
                          >
                            {facility.koszt_pobytu
                              ? `${Math.round(
                                  facility.koszt_pobytu
                                ).toLocaleString("pl-PL")} zł/mc`
                              : "Bezpłatne"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Link
                          href={`/placowka/${facility.id}`}
                          className="flex-1 px-4 py-3 sm:py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors text-center font-medium text-sm sm:text-base min-h-[44px] flex items-center justify-center"
                        >
                          Zobacz szczegóły
                        </Link>
                        {facility.telefon && (
                          <a
                            href={`tel:${facility.telefon.replace(/\s/g, "")}`}
                            className="flex-1 px-4 py-3 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-center font-medium text-sm sm:text-base min-h-[44px] flex items-center justify-center"
                          >
                            📞 {facility.telefon}
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Mapa Desktop */}
            <div className="hidden md:block lg:col-span-1">
              <div className="lg:sticky lg:top-20">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                  Lokalizacja na mapie
                </h3>
                <FacilityMap facilities={results} mode="multiple" />
              </div>
            </div>
          </div>
        ) : (
          // ✨ NEW: Empty State
          <motion.div
            variants={emptyStateVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-400" />
              </div>

              {/* Heading */}
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Brak wyników
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {hasActiveFilters
                  ? "Nie znaleźliśmy placówek spełniających wybrane kryteria."
                  : query
                  ? `Nie znaleźliśmy placówek dla: "${query}"`
                  : "Nie znaleźliśmy żadnych placówek."}
              </p>

              {/* Suggestions */}
              <div className="bg-blue-50 rounded-lg p-6 mb-6 text-left">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-accent-600" />
                  Spróbuj:
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  {hasActiveFilters && (
                    <li className="flex items-start gap-2">
                      <span className="text-accent-600 mt-0.5">•</span>
                      <span>Usuń niektóre filtry, aby poszerzyć wyniki</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="text-accent-600 mt-0.5">•</span>
                    <span>Sprawdź poprawność wpisanej miejscowości</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-600 mt-0.5">•</span>
                    <span>Wybierz inne województwo lub powiat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-600 mt-0.5">•</span>
                    <span>Rozszerz zakres cenowy</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors font-medium"
                  >
                    Wyczyść wszystkie filtry
                  </button>
                )}
                <Link
                  href="/"
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Wróć do strony głównej
                </Link>
              </div>

              {/* Alternative Search Suggestion */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Szukasz placówki w konkretnej lokalizacji?
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Link
                    href="/search?woj=malopolskie"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-accent-500 hover:bg-accent-50 transition-colors text-sm"
                  >
                    <MapPin className="w-4 h-4" />
                    Małopolskie
                  </Link>
                  <Link
                    href="/search?woj=slaskie"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-accent-500 hover:bg-accent-50 transition-colors text-sm"
                  >
                    <MapPin className="w-4 h-4" />
                    Śląskie
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
