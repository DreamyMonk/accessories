'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirestore } from "@/firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { Trash2, Plus, LoaderCircle, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CategoryManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;

    const q = query(collection(firestore, "categories"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(cats);
    });

    return () => unsubscribe();
  }, [firestore]);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    if (!firestore) return;

    // Check for duplicate
    if (categories.some(c => c.name.toLowerCase() === newCategory.trim().toLowerCase())) {
      toast({ title: "Duplicate", description: "This category already exists.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(firestore, "categories"), {
        name: newCategory.trim(),
        createdAt: serverTimestamp()
      });
      setNewCategory("");
      toast({ title: "Success", description: "Category added." });
    } catch (error) {
      console.error("Error adding category:", error);
      toast({ title: "Error", description: "Failed to add category.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!firestore) return;
    if (!confirm("Are you sure? This will remove the category from the selection list.")) return;

    try {
      await deleteDoc(doc(firestore, "categories", id));
      toast({ title: "Deleted", description: "Category removed." });
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({ title: "Error", description: "Failed to delete category.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Manage Categories
        </CardTitle>
        <CardDescription>
          Define the accessory types available for selection (e.g. Tempered Glass, Back Case).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input
            placeholder="New Category Name..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <Button onClick={handleAddCategory} disabled={loading || !newCategory.trim()}>
            {loading ? <LoaderCircle className="animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Add
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50 border">
              <span className="font-medium">{cat.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDeleteCategory(cat.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">
              No categories found. Add one above.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
