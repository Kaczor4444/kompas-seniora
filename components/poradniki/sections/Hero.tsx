export default function Hero() {
  return (
    <section className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-6 md:py-20 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=1920&q=80"
          alt="Senior z opiekunem"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/85 to-emerald-700/85"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 drop-shadow-lg">
          Poradniki dla Seniorów i Opiekunów
        </h1>
        <p className="text-base md:text-xl lg:text-2xl text-emerald-50 max-w-2xl drop-shadow leading-relaxed">
          <span className="hidden sm:inline">
            Praktyczne przewodniki - wszystko, co musisz wiedzieć o opiece, finansach i prawach seniora w jednym miejscu
          </span>
          <span className="sm:hidden">
            Praktyczne przewodniki o opiece, finansach i prawach seniora
          </span>
        </p>
      </div>
    </section>
  );
}
