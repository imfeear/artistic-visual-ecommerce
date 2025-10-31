import { useEffect, useState } from "react";
import { listCarouselPublic } from "../lib/api";

export default function Hero() {
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    listCarouselPublic()
      .then((data) => setSlides(data?.filter(x => x.active) || []))
      .catch(() => setSlides([]));
  }, []);

  // Exemplo mínimo: se você usa um slider já pronto, apenas passe slides.map(s => s.url)
  return (
    <div className="w-full h-[420px] relative overflow-hidden rounded-2xl">
      {slides.length === 0 ? (
        <img src="/placeholder-hero.jpg" alt="" className="w-full h-full object-cover" />
      ) : (
        // Coloque aqui o seu componente/carrossel existente, usando slides[i].url
        <img src={slides[0].url} alt="" className="w-full h-full object-cover" />
      )}
    </div>
  );
}
