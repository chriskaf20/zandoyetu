export interface CommuneData {
  name: string;
  landmarks: string[];
}

export const LUBUMBASHI_REGIONS: CommuneData[] = [
  {
    name: 'Lubumbashi',
    landmarks: [
      'Arrêt Horizon',
      'Université de Lubumbashi (UNILU)',
      'Bâtiment du Trentenaire',
      'Rond-point Carrefour',
      'Poste de Lubumbashi',
      'Hôpital du Cinquantenaire / Sendwe',
      'Arrêt Bel-Air / Golf',
      'Rond-point Bâtiment',
      'Centre-ville Chaussée Laurent Désiré Kabila'
    ]
  },
  {
    name: 'Annexe',
    landmarks: [
      'Cité des Jeunes',
      'Quartier Joli Site',
      'Arrêt Double Poteau',
      'Route Kipushi',
      'Kimbembe',
      'Navundu'
    ]
  },
  {
    name: 'Kampemba',
    landmarks: [
      'Marché Mzee Kabila',
      'Arrêt Bel-Air',
      'Rond-point Express',
      'Gare Centrale SNCC',
      'Paroisse Sainte-Bernadette',
      'Quartier Industriel'
    ]
  },
  {
    name: 'Katuba',
    landmarks: [
      'Arrêt Katuba II',
      'Rond-point Katuba',
      'Marché Central de Katuba',
      'Paroisse Saint-Jean',
      'Terrain de football Katuba'
    ]
  },
  {
    name: 'Kenya',
    landmarks: [
      'Marché Mzee (Kenya)',
      'Rond-point Kenya',
      'Arrêt Église Orthodoxe',
      'Avenue Kapenda',
      'Cercle Sportif'
    ]
  },
  {
    name: 'Kamalondo',
    landmarks: [
      'Stade du TP Mazembe',
      'Rond-point Kamalondo',
      'Marché de Kamalondo',
      'Arrêt Place Monument',
      'Paroisse Sainte-Thérèse'
    ]
  },
  {
    name: 'Ruashi',
    landmarks: [
      'Marché de la Ruashi',
      'Rond-point Ruashi',
      'Arrêt SNCC Ruashi',
      'Complexe Scolaire Baraka',
      'Hôpital de la Ruashi'
    ]
  },
  {
    name: 'Dilala (Kolwezi)',
    landmarks: [
      'Rond-point Mwangeji',
      'Centre-ville Dilala',
      'Marché Central de Kolwezi',
      'Hôpital Général de Référence Mwangeji',
      'Avenue Laurent Désiré Kabila'
    ]
  },
  {
    name: 'Manika (Kolwezi)',
    landmarks: [
      'Marché Manika',
      'Rond-point Kanina',
      'Arrêt Joli Site Kolwezi',
      'Complexe Scolaire Hewa Bora',
      'Gare SNCC Kolwezi'
    ]
  }
];

export function parseStructuredAddress(address: string | null | undefined): {
  commune: string;
  landmark: string;
  mapsLink: string;
} {
  if (!address) {
    return { commune: '', landmark: '', mapsLink: '' };
  }

  const parts = address.split(' | ');
  let commune = '';
  let landmark = '';
  let mapsLink = '';

  for (const part of parts) {
    if (part.startsWith('Commune: ')) {
      commune = part.substring('Commune: '.length);
    } else if (part.startsWith('Landmark: ')) {
      landmark = part.substring('Landmark: '.length);
    } else if (part.startsWith('MapsLink: ')) {
      mapsLink = part.substring('MapsLink: '.length);
    }
  }

  if (!commune && !landmark) {
    return { commune: '', landmark: address, mapsLink: '' };
  }

  return { commune, landmark, mapsLink };
}

export function formatStructuredAddress(commune: string, landmark: string, mapsLink: string): string {
  const parts = [];
  if (commune) parts.push(`Commune: ${commune}`);
  if (landmark) parts.push(`Landmark: ${landmark}`);
  if (mapsLink && mapsLink.trim()) parts.push(`MapsLink: ${mapsLink.trim()}`);
  return parts.join(' | ');
}
