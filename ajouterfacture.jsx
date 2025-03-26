import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

const AjouterFacture = () => {
  const [nomClient, setNomClient] = useState("");
  const [produits, setProduits] = useState([]); // Panier
  const [totalPrix, setTotalPrix] = useState(0);
  const [searchTerm, setSearchTerm] = useState(""); // Recherche
  const [selectedCategory, setSelectedCategory] = useState(""); // Catégorie sélectionnée
  const [categories, setCategories] = useState([]); // Liste des catégories
  const [produitsDisponibles, setProduitsDisponibles] = useState([]); // Produits disponibles

  // Récupérer les catégories et les produits
  useEffect(() => {
    const fetchData = async (url, setter, errorMessage) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setter(data.data);
        } else {
        }
      } catch (error) {
        toast.error("Erreur serveur.");
      }
    };

    fetchData("https://api.trendybox-dz.com/CategorieAll", setCategories, "Erreur lors de la récupération des catégories.");
    fetchData("https://api.trendybox-dz.com/ProduitAll", setProduitsDisponibles, "Erreur lors de la récupération des produits.");
  }, []);

  // Recalculer le prix total
  useEffect(() => {
    const total = produits.reduce((sum, produit) => sum + produit.prix_vente * produit.quantite, 0);
    setTotalPrix(total);
  }, [produits]);

  // Filtrer les produits selon la recherche et la catégorie
// Filtrer les produits selon la recherche, la catégorie et la disponibilité en stock
const filteredProduits = produitsDisponibles.filter((prod) => {
  const matchesSearch = prod.nom.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesCategory = !selectedCategory || prod.categorie_id === Number(selectedCategory);
  const inStock = prod.quantite > 0; // Exclure les produits en rupture de stock
  
  return matchesSearch && matchesCategory && inStock; // Ne garder que ceux en stock
});


  // Ajouter un produit au panier
  const handleAddToCart = (produit) => {
    setProduits((prevProduits) => {
      const produitExistant = prevProduits.find((p) => p.id === produit.id);
      if (produitExistant) {
        return prevProduits.map((p) =>
          p.id === produit.id ? { ...p, quantite: p.quantite + 1 } : p
        );
      }
      return [...prevProduits, { ...produit, quantite: 1 }];
    });
  };

  // Retirer un produit du panier
  const handleRemoveProduit = (id) => {
    setProduits((prevProduits) => prevProduits.filter((p) => p.id !== id));
  };

  // Soumettre la facture
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validation des données avant soumission
    if (!nomClient.trim()) {
      alert("Veuillez entrer le nom du client.");
      return;
    }
    if (produits.length === 0) {
      alert("Veuillez ajouter au moins un produit.");
      return;
    }
  
    const payload = {
      nom_client: nomClient,
      produits: produits.map((produit) => ({
        produit_id: produit.id,
        quantite: produit.quantite,
      })),
    };
  
    try {
      // Soumettre la facture à l'API
      const response = await fetch("https://api.trendybox-dz.com/FactureSave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement.");
      }
  
      toast.success("Facture enregistrée avec succès !");
      
      // Réinitialiser les champs du formulaire
      setNomClient("");
      setProduits([]);
  
      // Appeler l'API pour récupérer les produits mis à jour
      const fetchData = async () => {
        try {
          const response = await fetch("https://api.trendybox-dz.com/ProduitAll");
          if (response.ok) {
            const data = await response.json();
            setProduitsDisponibles(data.data); // Mettre à jour les produits disponibles
          } else {
            toast.error("Erreur lors de la récupération des produits.");
          }
        } catch (error) {
          toast.error("Erreur serveur.");
        }
      };
  
      // Appel de la fonction pour mettre à jour les produits disponibles
      fetchData();
  
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  
  return (
    <div style={{ display: "flex", height: "calc(100vh - 80px)", backgroundColor: "#f8f8f8", userSelect: "none" }}>
      <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
        {/* Barre de recherche et sélection de catégorie */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un produit"
            className="grow rounded-md w-full p-2 border"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Liste des produits */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
          {filteredProduits.map((prod) => (
            <div
              key={prod.id}
              onClick={() => handleAddToCart(prod)}
              style={{
                padding: "15px",
                backgroundColor: prod.quantite > 0 ? "#fff" : "#f0f0f0",
                borderRadius: "5px",
                boxShadow: "0px 0px 6px rgba(0, 0, 0, 0.1)",
                cursor: prod.quantite > 0 ? "pointer" : "not-allowed",
              }}
            >
              <img
src={(() => {
  try {
    return prod.image ? `https://api.trendybox-dz.com${JSON.parse(prod.image)[0]}` : "";
  } catch {
    return "";
  }
})()}                alt={prod.nom}
                style={{ height: "100px", margin: "0 auto", display: "block", borderRadius: "5px" }}
              />
              <h3 style={{ textAlign: "center", margin: "10px 0" }}>{prod.nom}</h3>
              <p style={{ textAlign: "center", color: "#555" }}>Prix : {prod.prix_vente} DA</p>
              <p style={{ textAlign: "center", color: prod.quantite > 0 ? "green" : "red" }}>
                {prod.quantite > 0 ? `Stock : ${prod.quantite}` : "Rupture"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Résumé de la facture */}
      <div
        style={{
          width: "400px",
          backgroundColor: "#fff",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0px 0px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#004d00",
            border: "4px solid #003300",
            borderRadius: "10px",
            padding: "10px",
            marginBottom: "20px",
            color: "#00ff00",
            fontFamily: "'Digital-7 Mono', monospace",
            fontSize: "2rem",
          }}
        >
          {totalPrix.toFixed(2)} DA
        </div>
        <div style={{ flex: 1, overflowY: "auto", marginBottom: "20px" }}>
          {produits.length === 0 ? (
            <p style={{ textAlign: "center", color: "#555" }}>Aucun produit ajouté.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {produits.map((produit) => (
                <li
                  key={produit.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#f9f9f9",
                    padding: "10px",
                    borderRadius: "5px",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <img
                     src={(() => {
                      try {
                        return produit.image ? `https://api.trendybox-dz.com${JSON.parse(produit.image)[0]}` : "";
                      } catch {
                        return "";
                      }
                    })()}
                      alt={produit.nom}
                      style={{ height: "60px", borderRadius: "5px", marginRight: "10px" }}
                    />
                    <div>
                      <h4 style={{ margin: 0 }}>{produit.nom}</h4>
                      <p style={{ margin: 0, color: "#555", fontSize: "0.9rem" }}>
                        Quantité : {produit.quantite}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveProduit(produit.id)}
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      color: "red",
                      cursor: "pointer",
                    }}
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Nom du client</label>
            <input
              type="text"
              value={nomClient}
              onChange={(e) => setNomClient(e.target.value)}
              placeholder="Entrez le nom du client"
              required
              style={{ padding: "10px", borderRadius: "5px", width: "100%" }}
            />
          </div>
          <button
          className="bg-[#070c2b] hover:bg-[#070c2bc8]"
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              color: "#fff",
              borderRadius: "5px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Enregistrer l'achat
          </button>
        </form>
      </div>
    </div>
  );
};

export default AjouterFacture;
