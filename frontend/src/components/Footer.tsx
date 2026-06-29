import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-bg-secondary pt-16">
      <div className="max-w-[1216px] mx-auto px-4">
        <div className="grid grid-cols-[1.6fr_1fr_1fr] gap-8 pb-12 max-md:grid-cols-2 max-sm:grid-cols-1">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 mb-[18px]">
              <div className="w-8 h-8 rounded-lg bg-primary-dark flex items-center justify-center text-white font-bold text-sm">BG</div>
              <span className="font-semibold text-lg text-text-primary">Bac Guinée</span>
            </Link>
            <p className="text-text-secondary max-w-[280px]">
              Consultez les résultats du Baccalauréat guinéen par nom, PV ou établissement.
            </p>
          </div>

          <div>
            <h4 className="text-base font-semibold mb-[18px]">Navigation</h4>
            <ul className="grid gap-3">
              <li><Link href="/" className="text-text-secondary hover:text-text-primary transition-colors">Recherche</Link></li>
              <li><Link href="/#stats" className="text-text-secondary hover:text-text-primary transition-colors">Statistiques</Link></li>
              <li><Link href="/contact" className="text-text-secondary hover:text-text-primary transition-colors">À propos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold mb-[18px]">Sources</h4>
            <ul className="grid gap-3">
              <li><span className="text-text-secondary">PDFs guineematin.com</span></li>
              <li><span className="text-text-secondary">API mon-portail.gtsco-kag.org</span></li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between py-6 border-t border-border-soft text-text-tertiary text-sm flex-wrap gap-3">
          <span>© 2026 Bac Guinée. Données issues de sources publiques.</span>
        </div>
      </div>
    </footer>
  );
}
