import { create } from "zustand";
import { getCategories, getCountries, getCurrencies } from "../services/bootstrap.service";
import type { Category, Country, Currency } from "../services/mappers";

interface AppDataState {
  loaded: boolean;
  countries: Country[];
  currencies: Record<string, Currency>;
  categories: Category[];
  categoryById: Record<string, Category>;
  countryByCode: Record<string, Country>;
  load: () => Promise<void>;
}

export const useAppDataStore = create<AppDataState>((set, get) => ({
  loaded: false,
  countries: [],
  currencies: {},
  categories: [],
  categoryById: {},
  countryByCode: {},

  load: async () => {
    if (get().loaded) return;
    const [countries, currencies, categories] = await Promise.all([
      getCountries(),
      getCurrencies(),
      getCategories(),
    ]);
    set({
      loaded: true,
      countries,
      currencies,
      categories,
      categoryById: Object.fromEntries(categories.map((c) => [c.id, c])),
      countryByCode: Object.fromEntries(countries.map((c) => [c.code, c])),
    });
  },
}));
