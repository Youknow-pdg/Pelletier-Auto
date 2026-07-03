import React, { useState } from 'react';
import { Search, SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { AVAILABLE_BRANDS, AVAILABLE_FUELS, AVAILABLE_TRANSMISSIONS } from '../mockData';

interface FiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBrand: string;
  onBrandChange: (brand: string) => void;
  selectedFuel: string;
  onFuelChange: (fuel: string) => void;
  selectedTransmission: string;
  onTransmissionChange: (trans: string) => void;
  maxPrice: number;
  onMaxPriceChange: (price: number) => void;
  highestPriceInStock: number;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  onResetFilters: () => void;
}

export default function Filters({
  searchQuery,
  onSearchChange,
  selectedBrand,
  onBrandChange,
  selectedFuel,
  onFuelChange,
  selectedTransmission,
  onTransmissionChange,
  maxPrice,
  onMaxPriceChange,
  highestPriceInStock,
  sortBy,
  onSortByChange,
  onResetFilters,
}: FiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
      
      {/* Primary Search and Main Brand Selector */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Keyword Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par modèle ou marque... (ex: 'Plaid', 'Carrera')"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 focus:border-gray-900 focus:bg-white rounded-xl text-sm font-medium transition outline-none"
          />
        </div>

        {/* Quick Brand Selector */}
        <div className="w-full md:w-56">
          <select
            value={selectedBrand}
            onChange={(e) => onBrandChange(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-gray-900 focus:bg-white rounded-xl text-sm font-medium transition outline-none appearance-none cursor-pointer"
          >
            <option value="">Toutes les marques</option>
            {AVAILABLE_BRANDS.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Sorting */}
        <div className="w-full md:w-56">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-gray-900 focus:bg-white rounded-xl text-sm font-medium transition outline-none appearance-none cursor-pointer"
          >
            <option value="recent">Plus récents d'abord</option>
            <option value="price_asc">Prix : croissant</option>
            <option value="price_desc">Prix : décroissant</option>
            <option value="year_desc">Année : récente</option>
            <option value="mileage_asc">Kilométrage : faible</option>
          </select>
        </div>

        {/* Toggle Advanced Filters Button */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center justify-center space-x-2 px-5 py-3 border rounded-xl text-sm font-semibold transition cursor-pointer ${
            showAdvanced || selectedFuel || selectedTransmission || maxPrice < highestPriceInStock
              ? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filtres</span>
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Price Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
              <span>Budget maximum</span>
              <span className="text-red-600 bg-red-50 px-2.5 py-1 rounded-md font-bold">
                {maxPrice === highestPriceInStock ? 'Illimité' : `${maxPrice.toLocaleString('fr-FR')} €`}
              </span>
            </div>
            <input
              type="range"
              min="20000"
              max={highestPriceInStock}
              step="5000"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>20 000 €</span>
              <span>{(highestPriceInStock).toLocaleString('fr-FR')} €</span>
            </div>
          </div>

          {/* Fuel Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Carburant</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onFuelChange('')}
                className={`text-xs px-3 py-2 rounded-lg font-semibold border transition ${
                  selectedFuel === ''
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Tous
              </button>
              {AVAILABLE_FUELS.map((fuel) => (
                <button
                  key={fuel}
                  onClick={() => onFuelChange(fuel)}
                  className={`text-xs px-3 py-2 rounded-lg font-semibold border transition ${
                    selectedFuel === fuel
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {fuel}
                </button>
              ))}
            </div>
          </div>

          {/* Transmission Filter & Reset */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Transmission</label>
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => onTransmissionChange('')}
                  className={`text-xs px-3 py-2 rounded-lg font-semibold border transition ${
                    selectedTransmission === ''
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Toutes
                </button>
                {AVAILABLE_TRANSMISSIONS.map((trans) => (
                  <button
                    key={trans}
                    onClick={() => onTransmissionChange(trans)}
                    className={`text-xs px-3 py-2 rounded-lg font-semibold border transition ${
                      selectedTransmission === trans
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {trans}
                  </button>
                ))}
              </div>

              {/* Reset Button */}
              {(searchQuery || selectedBrand || selectedFuel || selectedTransmission || maxPrice < highestPriceInStock) && (
                <button
                  onClick={onResetFilters}
                  className="flex items-center space-x-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Réinitialiser</span>
                </button>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
