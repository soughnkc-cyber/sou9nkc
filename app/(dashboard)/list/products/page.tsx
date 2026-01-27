"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { DataTable } from "@/components/datatable";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
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
import { getUsers } from "@/lib/actions/users";
import { getColumns, Product } from "./column";
import { Option } from "./agent-select";

/* Stats */
const getProductStats = (products: Product[]) => ({
  total: products.length,
  totalValue: products.reduce((sum, p) => sum + p.price, 0),
});

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [agents, setAgents] = useState<Option[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

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
      const [productsData, usersData] = await Promise.all([
        getProducts(),
        getUsers()
      ]);
      setProducts(productsData);
      
      const filteredAgents = usersData
        .filter(u => u.role === "AGENT" || u.role === "AGENT_TEST")
        .map(u => ({ id: u.id, name: u.name }));
      setAgents(filteredAgents);
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
    fetchProducts();
    insertProducts();
  }, [fetchProducts, insertProducts]);

  /* Memo */
  const stats = useMemo(() => getProductStats(products), [products]);

  const columns = useMemo(
    () => getColumns(agents, handleUpdateAgents),
    [agents]
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Produits</h1>
          <p className="text-gray-500 mt-1">
            Liste des produits récupérés depuis Shopify
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchProducts}
          disabled={isLoadingPage}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${
              isLoadingPage ? "animate-spin" : ""
            }`}
          />
          Rafraîchir
        </Button>
      </div>

      {/* Stats */}
      {products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Card className="p-3">
            <CardContent className="p-0 flex justify-between">
              <span>Total produits</span>
              <span className="font-bold">{stats.total}</span>
            </CardContent>
          </Card>

          <Card className="p-3">
            <CardContent className="p-0 flex justify-between">
              <span>Valeur totale</span>
              <span className="font-bold text-green-600">
                {stats.totalValue.toLocaleString("fr-FR")} MRU
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des produits</CardTitle>
          <CardDescription>
            {stats.total} produits synchronisés
          </CardDescription>
        </CardHeader>

        <CardContent>
          <DataTable<Product, unknown>
            columns={columns}
            data={products}
            searchPlaceholder="Rechercher un produit..."
            pageSizeOptions={[5, 10, 20]}
            defaultPageSize={10}
            showSearch
            showPagination
          />
        </CardContent>
      </Card>
    </div>
  );
}
