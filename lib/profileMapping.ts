// Mapowanie profili opieki na spójne opisy
export const normalizeProfilOpieki = (profil: string, typPlacowki: string): string => {
    if (!profil) return "Nieokreślony";
    
    const profilLower = profil.toLowerCase().trim();
    
    // Mapowanie kodów SDS A-D
    const sdsMapping: Record<string, string> = {
      'a': 'Osoby z niepełnosprawnością intelektualną',
      'b': 'Osoby z zaburzeniami psychicznymi', 
      'c': 'Osoby z niepełnosprawnością fizyczną',
      'd': 'Osoby z chorobami przewlekłymi'
    };
    
    // Sprawdź czy to kod SDS
    if (sdsMapping[profilLower]) {
      return sdsMapping[profilLower];
    }
    
    // Mapowanie opisów DPS na standardowe kategorie
    if (profilLower.includes('podeszły') || profilLower.includes('wieku')) {
      return 'Osoby w podeszłym wieku';
    }
    if (profilLower.includes('psychicznie') || profilLower.includes('psychiczne')) {
      return 'Osoby z zaburzeniami psychicznymi';
    }
    if (profilLower.includes('somatycznie') || profilLower.includes('przewlekle')) {
      return 'Osoby z chorobami przewlekłymi';
    }
    if (profilLower.includes('niepełnosprawnych intelektualnie')) {
      return 'Osoby z niepełnosprawnością intelektualną';
    }
    if (profilLower.includes('niepełnosprawnych fizycznie')) {
      return 'Osoby z niepełnosprawnością fizyczną';
    }
    
    // Jeśli nie można zmapować, zwróć oryginalny
    return profil;
  };