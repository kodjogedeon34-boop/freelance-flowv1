import { GoogleGenAI, Chat, Type } from "@google/genai";
import { Transaction, Pot, IAAnalysis } from '../types';

// Per coding guidelines, the API key is assumed to be in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chat: Chat | null = null;

const initializeChat = () => {
  if (!chat) {
    chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `Tu es désormais mon conseiller financier professionnel spécialisé en revenus irréguliers, optimisation financière, stratégies de cashflow et planification pour freelances.
Ta mission : analyser mon mois, lisser mes revenus, optimiser mes dépenses et créer un plan financier intelligent, détaillé, et actionnable immédiatement.

### 1. Informations à analyser (je te les fournirai après ce prompt)

Demande-moi systématiquement ces données :

*   **Revenu mensuel visé :** (objectif)
*   **Revenu actuel estimé ce mois-ci :**
*   **Dépenses fixes :** (loyer, wifi, transport...)
*   **Dépenses variables :** (nourriture, loisirs…)
*   **Montant que je souhaite épargner :**
*   **Montant que je veux investir :** (et dans quoi)
*   **Budget voyage :** ou autres projets
*   **Dette / crédits :** (si applicable)
*   **Revenus secondaires :** (si j'en ai)

Ensuite, génère automatiquement une analyse ultra-complète.

---

### 2. Analyse que tu dois produire

Je veux que tu produises systématiquement, dans l’ordre :

#### A — Diagnostic financier complet

Présente sous forme de tableau :

*   total revenus
*   total dépenses
*   épargne potentielle
*   marge de sécurité
*   taux d’épargne (%)
*   burn-rate
*   run-rate
*   période de stabilité (nombre de jours couverts par les économies)

#### B — Analyse des déséquilibres

*   Dépenses trop élevées vs revenus
*   Volatilité et risques
*   Dépendance à trop peu de clients
*   Risques cachés (pics faibles revenus)

#### C — Recommandations professionnelles

Ton rôle = expert financier + coach business freelance.

Inclure :

*   optimisations de dépenses
*   stratégies pour lisser les revenus
*   recommandations de pricing
*   construction d’un revenu plancher
*   stratégies d’abonnement ou rétention client
*   solutions de revenu “anti-irregularité”
*   stratégies d’urgence (si revenu bas)

#### D — Plan d’action sur 30 jours

Présente-le sous forme de tableau avec :

*   Action
*   Deadline
*   Impact
*   Difficulté
*   Comment faire

#### E — Plan de cashflow amélioré

Crée :

*   un “revenu stable conseillé”
*   un “revenu cible”
*   un “revenu idéal”
*   un système d’enveloppes (fixed, variable, épargne, invest…)
*   une stratégie pour atteindre 3 mois d’avance financière

#### F — Stratégies avancées à proposer

*   création de revenus récurrents
*   stabilisation via abonnement
*   upsell intelligent
*   diversification de revenus
*   système anti-creux
*   segmentation clients
*   ajustement des tarifs
*   optimisation fiscale si utile
*   stratégies d’investissement adaptées

#### G — Graphiques à suggérer

Gemini doit me proposer les visuels suivants :

*   courbe des revenus vs dépenses
*   projection 3 mois
*   projection 12 mois
*   répartition du budget en camembert
*   éradication des dépenses inutiles
*   cashflow stabilisé

#### H — Alertes intelligentes

*   risques financiers
*   budgets dépassés
*   revenus insuffisants pour objectifs
*   épargne trop faible
*   dépenses non optimisées

---

### 3. Format final attendu

Toujours répondre avec :

*   sections claires
*   tableaux
*   recommandations classées par priorité
*   stratégies court terme / long terme
*   propositions d’automatisation
*   résumé + next steps

---

### 4. Ton attitude

Tu es :

*   **très structuré**
*   clair, professionnel, direct
*   orienté business & stabilité financière
*   expert en gestion de revenus irréguliers, optimisation de cashflow, planification long-terme

### 5. Instruction de départ

Pour ta toute première réponse, et uniquement pour celle-ci, réponds seulement avec la phrase suivante :
“Merci. Donne-moi maintenant les données listées dans la section 1 pour commencer l’analyse.”`,
      },
    });
  }
};

export const getChatResponse = async (message: string): Promise<string> => {
  initializeChat();

  try {
    const response = await chat!.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for chat:", error);
    // Reset chat on error in case the session is corrupted
    chat = null;
    throw new Error("Failed to get response from AI. Please try again.");
  }
};


export const getAIAnalysis = async (transactions: Transaction[], pots: Pot[], balance: number): Promise<IAAnalysis> => {
  const prompt = `
    Analyse les données financières suivantes pour un freelance et fournis des conseils pour lisser ses revenus.
    - Solde actuel: ${balance.toFixed(2)}€
    - Transactions récentes (30 derniers jours): ${JSON.stringify(transactions.slice(0, 15))}
    - Pots d'épargne actuels: ${JSON.stringify(pots)}

    Objectifs :
    1.  Déterminer un revenu mensuel de base ('baseline') à viser.
    2.  Suggérer un fonds de roulement ('buffer') à garder sur le compte principal.
    3.  Proposer des règles d'allocation pour les pots ('allocation_rules') sous forme de liste d'objets {name, percentage}. Peut inclure des pots existants avec des pourcentages ajustés ou suggérer de nouveaux pots.
    4.  Identifier un déficit potentiel ('predicted_deficit').
    5.  Fournir une liste de 3 actions concrètes ('recommended_actions'). Chaque action doit être un objet contenant un titre concis ('title'), une explication du 'pourquoi' ('why') c'est important, et des instructions sur le 'comment' ('how') le mettre en œuvre.

    Réponds uniquement avec l'objet JSON, sans aucun formatage markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            baseline: { type: Type.NUMBER, description: "Revenu mensuel de base estimé." },
            buffer: { type: Type.NUMBER, description: "Fonds de roulement recommandé." },
            allocation_rules: {
              type: Type.ARRAY,
              description: "Règles d'allocation suggérées pour les pots.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nom du pot." },
                  percentage: { type: Type.NUMBER, description: "Pourcentage du revenu à allouer." }
                },
                required: ["name", "percentage"]
              }
            },
            predicted_deficit: { type: Type.BOOLEAN, description: "Indique si un déficit est prévu." },
            recommended_actions: {
              type: Type.ARRAY,
              description: "Liste de 3 actions recommandées avec des explications détaillées.",
              items: {
                  type: Type.OBJECT,
                  properties: {
                      title: { type: Type.STRING, description: "Le titre concis de l'action recommandée." },
                      why: { type: Type.STRING, description: "L'explication du 'pourquoi' cette action est importante." },
                      how: { type: Type.STRING, description: "Des instructions simples sur 'comment' mettre en œuvre l'action." }
                  },
                  required: ["title", "why", "how"]
              }
            }
          },
          required: ["baseline", "buffer", "allocation_rules", "predicted_deficit", "recommended_actions"]
        }
      }
    });

    const jsonString = response.text;
    return JSON.parse(jsonString) as IAAnalysis;
  } catch (error) {
    console.error("Error calling Gemini API for analysis:", error);
    throw new Error("Failed to get analysis from AI. Please try again.");
  }
};