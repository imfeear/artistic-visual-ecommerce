import CardNav from "./components/CardNav";
import logo from "./assets/logo.png"; // opcional

export default function App() {
const grupos = [
  {
    label: "Esculturas",
    textColor: "#fff",
    linkColor: "#fff",
    // Azul + Ciano + Amarelo (blobs)
    bgGradient: `
      radial-gradient(120px 140px at 18% 25%, var(--azul), transparent 70%),
      radial-gradient(140px 120px at 82% 22%, var(--ciano), transparent 72%),
      radial-gradient(160px 160px at 65% 78%, var(--amarelo), transparent 74%),
      linear-gradient(135deg, rgba(255,255,255,.16), rgba(255,255,255,.06))
    `,
    links: [
      { label: "Coleções", ariaLabel: "Coleções", href: "#" },
      { label: "Peças Únicas", ariaLabel: "Peças únicas", href: "#" },
    ],
  },
  {
    label: "Destaques",
    textColor: "#fff",
    linkColor: "#fff",
    // Amarelo + Rosa + Laranja (blobs)
    bgGradient: `
      radial-gradient(130px 130px at 22% 28%, var(--amarelo), transparent 70%),
      radial-gradient(160px 140px at 78% 25%, var(--rosa), transparent 73%),
      radial-gradient(170px 150px at 60% 80%, var(--laranja), transparent 75%),
      linear-gradient(135deg, rgba(255,255,255,.14), rgba(255,255,255,.05))
    `,
    links: [
      { label: "Mais Vendidos", ariaLabel: "Mais vendidos", href: "#" },
      { label: "Novidades", ariaLabel: "Novidades", href: "#" },
    ],
  },
  {
    label: "Contato",
    textColor: "#fff",
    linkColor: "#fff",
    // Ciano + Azul + Rosa (blobs)
    bgGradient: `
      radial-gradient(140px 120px at 20% 30%, var(--ciano), transparent 70%),
      radial-gradient(150px 160px at 85% 20%, var(--azul), transparent 74%),
      radial-gradient(140px 140px at 60% 82%, var(--rosa), transparent 72%),
      linear-gradient(135deg, rgba(255,255,255,.15), rgba(255,255,255,.05))
    `,
    links: [
      { label: "WhatsApp", ariaLabel: "WhatsApp", href: "#contato" },
      { label: "Instagram", ariaLabel: "Instagram", href: "#" },
      { label: "Localização", ariaLabel: "Localização", href: "#" },
    ],
  },
];

  const onSearch = (term) => {
    if (term) console.log("Buscar:", term);
  };

  return (
    <div className="bg-carnaval-vibrante text-slate-900">
      <div className="relative">
        <CardNav
          logo={logo}
          logoAlt="Recife Art"
          brand="Recife Art"
          items={grupos}
          baseColor="rgba(255,255,255,0.82)"
          menuColor="#0f172a"
          onSearch={onSearch}
          searchPlaceholder="Buscar esculturas..."
        />
        <div className="h-[90px]" />
      </div>

      <main className="relative z-[1] mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Esculturas de Carnaval do Recife
        </h1>
        <p className="mt-2 text-slate-800/90">Arte autoral, peças únicas e edição limitada.</p>

        <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map((i) => (
            <article key={i} className="rounded-2xl bg-white/92 shadow-[0_10px_30px_rgba(0,0,0,.15)] hover:shadow-[0_14px_36px_rgba(0,0,0,.18)] transition p-4 backdrop-blur">
              <div className="aspect-[16/10] rounded-xl bg-white/90 border border-black/10 flex items-center justify-center overflow-hidden">
                <img
                  src={`https://picsum.photos/seed/escultura-${i}/900/600`}
                  alt={`Escultura ${i}`}
                  className="max-h-full max-w-full object-contain mx-auto"
                />
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">Escultura #{i}</h3>
              <p className="text-sm text-slate-600">Descrição breve da peça.</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-bold text-slate-900">R$ 199,90</span>
                <a
                  href="https://wa.me/5581999999999?text=Tenho%20interesse%20na%20escultura"
                  className="px-3 py-1.5 rounded-lg text-sm text-white"
                  style={{ background: "linear-gradient(135deg, var(--rosa), var(--azul))" }}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </div>
            </article>
          ))}
        </section>
      </main>

      <footer id="contato" className="relative z-[1] mt-10 border-t border-white/30">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-slate-900/80">
          © {new Date().getFullYear()} Recife Art — Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
