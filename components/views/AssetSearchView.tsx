import React from 'react';
import { ChevronRight, Search } from 'lucide-react';

interface AssetSearchViewProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filteredAssets: Array<{ code: string; name: string; description?: string }>;
  onBack: () => void;
  onAssetSelect: (assetCode: string) => void;
}

export const AssetSearchView: React.FC<AssetSearchViewProps> = ({
  searchTerm,
  setSearchTerm,
  filteredAssets,
  onBack,
  onAssetSelect,
}) => {
  return (
    <div className="p-4 font-sans">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center gap-1 pr-3 pl-2 group active:scale-95 transition-all"
        >
          <ChevronRight className="rtl:rotate-180 dark:text-white" size={20} />
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">بازگشت</span>
        </button>
        <h1 className="font-bold text-lg dark:text-white mr-auto">جستجوی تجهیز</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="نام یا کد تجهیز را وارد کنید..."
          className="w-full pl-4 pr-12 py-4 rounded-2xl border-none shadow-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-3">
        {filteredAssets.map((asset) => (
          <div
            key={asset.code}
            onClick={() => onAssetSelect(asset.code)}
            className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-transform cursor-pointer"
          >
            <div className="font-bold text-slate-800 dark:text-white">{asset.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
              {asset.code}
            </div>
            {asset.description && <div className="text-xs text-slate-400 mt-1">{asset.description}</div>}
          </div>
        ))}
        {searchTerm && filteredAssets.length === 0 && (
          <div className="text-center text-slate-400 mt-10">موردی یافت نشد</div>
        )}
      </div>
    </div>
  );
};
