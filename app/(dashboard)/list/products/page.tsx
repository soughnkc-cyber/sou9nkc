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

/* Actions Products */
import { getProducts, insertNewProducts, updateProductAgents } from "@/lib/actions/products";
import { getAgents, getMe } from "@/lib/actions/users";
import { getColumns, Product } from "./column";
import { Option } from "./agent-select";
import PermissionDenied from "@/components/permission-denied";
import { cn } from "@/lib/utils";
import { ShoppingBag, DollarSign } from "lucide-react";


/* Stats */
const getProductStats = (products: Product[]) => ({
  total: products.length,
  totalValue: products.reduce((sum, p) => sum + p.price, 0),
});

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [agents, setAgents] = useState<Option[]>([]);
  const [selectedRows, setSelectedRows] = useState<Product[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [canEditPermission, setCanEditPermission] = useState(false);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color,
    description
  }: { 
    title: string; 
    value: number | string; 
    icon?: any;
    color?: string;
    description?: React.ReactNode;
  }) => (
    <Card className="relative p-3 transition-all duration-300 border border-gray-100 shadow-xs hover:shadow-md rounded-xl overflow-hidden group bg-white flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-1">
        <div className={cn("p-1.5 rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors", color)}>
          {Icon && <Icon className="h-4 w-4" />}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">{title}</p>
        <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight">{value}</h3>
        {description && <div className="mt-1">{description}</div>}
      </div>
    </Card>
  );


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
      toast.error("Erreur lors de la synchronisation des produits");
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
      
      const formattedAgents = agentsData.map(u => ({ id: u.id, name: u.name }));
      setAgents(formattedAgents);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoadingPage(false);
    }
  }, []);

  const handleUpdateAgents = async (productId: string, data: { assignedAgentIds?: string[]; hiddenForAgentIds?: string[] }) => {
    try {
      await updateProductAgents(productId, data);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...data } : p));
      toast.success("Agents mis à jour");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour des agents");
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
  const stats = useMemo(() => getProductStats(products), [products]);

  const columns = useMemo(
    () => getColumns(agents, handleUpdateAgents, canEditPermission),
    [agents, canEditPermission]
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
      {/* <div className="flex flex-col md:flex-row justify-end items-center gap-4 sm:gap-6"> */}
        {/* <div className="text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">Produits</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Liste des produits récupérés depuis Shopify</p>
        </div> */}
        {/* <div className="flex items-center justify-center w-full md:w-auto gap-2 sm:gap-3">
            <Button 
                variant="outline" 
                size="sm" 
                className="h-10 rounded-xl px-3 sm:px-4 font-bold border-gray-200 hover:bg-blue-50 hover:text-[#1F30AD] hover:border-blue-200 shrink-0" 
                onClick={fetchProducts} 
                disabled={isLoadingPage}
            >
              <RefreshCw className={cn("h-4 w-4 sm:mr-2", isLoadingPage && "animate-spin")} />
              <span className="hidden sm:inline">Rafraîchir</span>
            </Button>
        </div> */}
      {/* </div> */}

      {/* Stats */}
      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <StatCard
            title="Total Produits"
            value={stats.total}
            icon={ShoppingBag}
            color="bg-blue-50"
          />

          <StatCard
            title="Valeur Totale"
            value={`${stats.totalValue.toLocaleString("fr-FR")} MRU`}
            icon={DollarSign}
            color="bg-green-50"
          />
        </div>
      )}

      {/* Table */}
      <Card className="border border-gray-100 shadow-xs bg-white rounded-2xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle>Liste des produits</CardTitle>
          <CardDescription>
            {stats.total} produits synchronisés
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
                    className="h-8 rounded-lg px-2 sm:px-3 font-bold border-gray-200 hover:bg-blue-50 hover:text-[#1F30AD] transition-all text-[10px] font-mono" 
                    disabled
                  >
                    <Edit className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Modifier</span>
                  </Button>
                )}
                {selectedRows.length > 0 && (
                  <div className="flex items-center px-2 py-1 bg-blue-50 text-[#1F30AD] rounded-lg border border-blue-100 font-bold text-[10px] animate-in fade-in slide-in-from-top-1">
                    {selectedRows.length} <span className="hidden sm:inline ml-1">sélectionnés</span>
                  </div>
                )}
              </div>
            }
            searchPlaceholder="Rechercher un produit..."
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
