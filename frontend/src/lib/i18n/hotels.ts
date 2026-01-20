import type { Locale } from "./locales";

export type HotelsStrings = {
  pageTitle: string;
  pageDescription: string;
  searchPlaceholder: string;
  featuredSection: string;
  allPropertiesSection: string;
  viewDetails: string;
  featured: string;
  reviews: string;
  noResultsTitle: string;
  noResultsDescription: string;
  amenities: {
    wifi: string;
    restaurant: string;
    gym: string;
    spa: string;
    pool: string;
  };
};

export function getHotelsStrings(locale: Locale): HotelsStrings {
  if (locale === "fr") {
    return {
      pageTitle: "Explorer les hôtels MyStay",
      pageDescription: "Découvrez notre collection d'hôtels partenaires dans le monde entier",
      searchPlaceholder: "Rechercher par nom d'hôtel ou lieu...",
      featuredSection: "Propriétés en vedette",
      allPropertiesSection: "Toutes les propriétés",
      viewDetails: "Voir les détails",
      featured: "En vedette",
      reviews: "avis",
      noResultsTitle: "Aucun hôtel trouvé",
      noResultsDescription: "Essayez d'ajuster votre recherche pour trouver ce que vous cherchez.",
      amenities: {
        wifi: "Wi-Fi",
        restaurant: "Restaurant",
        gym: "Salle de sport",
        spa: "Spa",
        pool: "Piscine",
      },
    };
  }

  if (locale === "es") {
    return {
      pageTitle: "Explorar hoteles MyStay",
      pageDescription: "Descubre nuestra colección de hoteles asociados en todo el mundo",
      searchPlaceholder: "Buscar por nombre de hotel o ubicación...",
      featuredSection: "Propiedades destacadas",
      allPropertiesSection: "Todas las propiedades",
      viewDetails: "Ver detalles",
      featured: "Destacado",
      reviews: "reseñas",
      noResultsTitle: "No se encontraron hoteles",
      noResultsDescription: "Intente ajustar su búsqueda para encontrar lo que busca.",
      amenities: {
        wifi: "Wi-Fi",
        restaurant: "Restaurante",
        gym: "Gimnasio",
        spa: "Spa",
        pool: "Piscina",
      },
    };
  }

  return {
    pageTitle: "Explore MyStay Hotels",
    pageDescription: "Discover our collection of partner hotels worldwide",
    searchPlaceholder: "Search by hotel name or location...",
    featuredSection: "Featured Properties",
    allPropertiesSection: "All Properties",
    viewDetails: "View Details",
    featured: "Featured",
    reviews: "reviews",
    noResultsTitle: "No hotels found",
    noResultsDescription: "Try adjusting your search to find what you're looking for.",
    amenities: {
      wifi: "Wi-Fi",
      restaurant: "Restaurant",
      gym: "Gym",
      spa: "Spa",
      pool: "Pool",
    },
  };
}
