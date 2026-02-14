"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { DataTable } from "@/components/datatable";
import { Button } from "@/components/ui/button";
import { RefreshCw, Edit } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";

/* Actions Products */
import { getProducts, insertNewProducts, updateProductAgents } from "@/lib/actions/products";
import { getAgents, getMe } from "@/lib/actions/users";
import { getColumns, Product } from "./column";
import { Option } from "./agent-select";
import PermissionDenied from "@/components/permission-denied";
import { cn } from "@/lib/utils";
import { ShoppingBag, DollarSign } from "lucide-react";


export default function ProductsPage() {
  const t = useTranslations('Products');
  const locale = useLocale();

  const [products, setProducts] = useState<Product[]>([]);
  const [agents, setAgents] = useState<Option[]>([]);
  const [selectedRows, setSelectedRows] = useState<Product[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [canEditPermission, setCanEditPermission] = useState(false);

  const StatCard = ({ title, value, icon: Icon, active, onClick, color, trend, trendUp, isClickable = true, bgColor, description }: any) => {
    return (
      <Card
        onClick={() => isClickable && onClick?.()}
        style={{ backgroundColor: bgColor }}
        className={cn(
          "relative p-2 sm:p-3 border border-gray-100 shadow-xs rounded-xl overflow-hidden flex flex-col justify-between h-full",
          isClickable ? "cursor-pointer transition-all duration-300 hover:shadow-md hover:border-blue-200 group" : "cursor-default",
          active ? "ring-2 ring-[#1F30AD] ring-offset-2" : ""
        )}
      >
      <div className="flex justify-between items-start mb-1 sm:mb-1">
        <div className={cn("p-1.5 sm:p-2 rounded-lg sm:rounded-xl group-hover:bg-black/5 transition-colors", color)}>
          {Icon && <Icon className="h-4 w-4 sm:h-4 sm:w-4" />}
        </div>
      </div>
      <div>
        <p className="text-[10px] sm:text-[10px] font-black text-gray-900 uppercase tracking-widest mb-0.5 sm:mb-1">{title}</p>
        <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight leading-tight">{value}</h3>
        {description && <div className="mt-1 text-xs text-muted-foreground">{description}</div>}
      </div>
    </Card>
  ); };

  /* Sync Shopify → DB */
  const insertProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message);
      }
    } catch (error) {
      console.error(error);
      // toast.error(t('syncError'));
    }
  }, []);

  /* Fetch DB */
  const fetchProducts = useCallback(async () => {
    setIsLoadingPage(true);
    try {
      const [productsData, agentsData] = await Promise.all([
        getProducts(),
        getAgents()
      ]);
      setProducts(productsData);
      
      const formattedAgents = agentsData.map(u => ({ 
        id: u.id, 
        name: u.name,
        role: u.role,
        isActive: u.isActive
      }));
      setAgents(formattedAgents);
    } catch (error) {
      console.error(error);
      toast.error(t('errorLoading'));
    } finally {
      setIsLoadingPage(false);
    }
  }, [t]);

  const handleUpdateAgents = async (productId: string, data: { assignedAgentIds?: string[]; hiddenForAgentIds?: string[] }) => {
    try {
      await updateProductAgents(productId, data);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...data } : p));
      toast.success(t('updateSuccess'));
    } catch (error) {
      console.error(error);
      toast.error(t('updateError'));
    }
  };

  useEffect(() => {
    getMe().then(user => {
      if (user?.canViewProducts) {
        setHasPermission(true);
        setCanEditPermission(user.canEditProducts);
        fetchProducts();
        insertProducts();
      } else {
        setHasPermission(false);
      }
    });
  }, [fetchProducts, insertProducts]);


  /* Memo */
  const stats = useMemo(() => {
    return {
        total: products.length,
        totalValue: products.reduce((sum, p) => sum + p.price, 0),
    };
  }, [products]);

  const columns = useMemo(
    () => getColumns(agents, handleUpdateAgents, canEditPermission, t, locale),
    [agents, canEditPermission, t, locale]
  );

  if (hasPermission === false) return <PermissionDenied />;
  if (hasPermission === null) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('title')}</h1>
          <p className="text-gray-500 font-medium">{t('description')}</p>
        </div>
      </div>

      {/* Stats */}
      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title={t('totalProducts')}
            value={stats.total}
            icon={ShoppingBag}
            color="bg-blue-500/10 text-blue-600"
            bgColor="#e3f0ff"
          />

          <StatCard
            title={t('totalValue')}
            value={`${stats.totalValue.toLocaleString("fr-FR")} MRU`}
            icon={DollarSign}
            color="bg-emerald-500/10 text-emerald-600"
            bgColor="#e3ffef"
          />
        </div>
      )}

      {/* Table */}
      <Card className="border border-gray-100 shadow-xs bg-white rounded-2xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle>{t('productsList')}</CardTitle>
          <CardDescription>
            {t('syncedCount', { count: stats.total })}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <DataTable<Product, unknown>
            columns={columns}
            data={products}
            onSelectionChange={setSelectedRows}
            extraSearchActions={
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedRows.length === 1 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-lg px-2 sm:px-3 font-bold border-gray-200 hover:bg-blue-50 hover:text-[#1F30AD] transition-all text-[10px]" 
                    disabled
                  >
                    <Edit className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">{t('edit')}</span>
                  </Button>
                )}
                {selectedRows.length > 0 && (
                  <div className="flex items-center px-2 py-1 bg-blue-50 text-[#1F30AD] rounded-lg border border-blue-100 font-bold text-[10px] animate-in fade-in slide-in-from-top-1">
                    {selectedRows.length} <span className="hidden sm:inline ml-1">{t('selected')}</span>
                  </div>
                )}
              </div>
            }
            searchPlaceholder={t('searchPlaceholder')}
            pageSizeOptions={[10, 20, 50]}
            defaultPageSize={50}
            showSearch
            showPagination
          />
        </CardContent>
      </Card>
    </div>
  );
}
