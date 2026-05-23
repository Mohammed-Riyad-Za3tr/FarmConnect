export interface CommuneOption {
  nameEn: string;
  nameAr: string;
}

export interface WilayaOption {
  code: string;
  nameEn: string;
  nameAr: string;
  communes: CommuneOption[];
}

export const ALGERIA_WILAYAS: WilayaOption[] = [
  { code: '01', nameEn: 'Adrar', nameAr: 'ادرار', communes: [{ nameEn: 'Adrar', nameAr: 'ادرار' }] },
  { code: '02', nameEn: 'Chlef', nameAr: 'الشلف', communes: [{ nameEn: 'Chlef', nameAr: 'الشلف' }] },
  { code: '03', nameEn: 'Laghouat', nameAr: 'الاغواط', communes: [{ nameEn: 'Laghouat', nameAr: 'الاغواط' }] },
  { code: '04', nameEn: 'Oum El Bouaghi', nameAr: 'ام البواقي', communes: [{ nameEn: 'Oum El Bouaghi', nameAr: 'ام البواقي' }] },
  { code: '05', nameEn: 'Batna', nameAr: 'باتنة', communes: [{ nameEn: 'Batna', nameAr: 'باتنة' }] },
  { code: '06', nameEn: 'Bejaia', nameAr: 'بجاية', communes: [{ nameEn: 'Bejaia', nameAr: 'بجاية' }] },
  { code: '07', nameEn: 'Biskra', nameAr: 'بسكرة', communes: [{ nameEn: 'Biskra', nameAr: 'بسكرة' }] },
  { code: '08', nameEn: 'Bechar', nameAr: 'بشار', communes: [{ nameEn: 'Bechar', nameAr: 'بشار' }] },
  { code: '09', nameEn: 'Blida', nameAr: 'البليدة', communes: [{ nameEn: 'Blida', nameAr: 'البليدة' }] },
  { code: '10', nameEn: 'Bouira', nameAr: 'البويرة', communes: [{ nameEn: 'Bouira', nameAr: 'البويرة' }] },
  { code: '11', nameEn: 'Tamanrasset', nameAr: 'تمنراست', communes: [{ nameEn: 'Tamanrasset', nameAr: 'تمنراست' }] },
  { code: '12', nameEn: 'Tebessa', nameAr: 'تبسة', communes: [{ nameEn: 'Tebessa', nameAr: 'تبسة' }] },
  { code: '13', nameEn: 'Tlemcen', nameAr: 'تلمسان', communes: [{ nameEn: 'Tlemcen', nameAr: 'تلمسان' }] },
  { code: '14', nameEn: 'Tiaret', nameAr: 'تيارت', communes: [{ nameEn: 'Tiaret', nameAr: 'تيارت' }] },
  { code: '15', nameEn: 'Tizi Ouzou', nameAr: 'تيزي وزو', communes: [{ nameEn: 'Tizi Ouzou', nameAr: 'تيزي وزو' }] },
  { code: '16', nameEn: 'Alger', nameAr: 'الجزائر', communes: [{ nameEn: 'Alger Centre', nameAr: 'الجزائر الوسطى' }] },
  { code: '17', nameEn: 'Djelfa', nameAr: 'الجلفة', communes: [{ nameEn: 'Djelfa', nameAr: 'الجلفة' }] },
  { code: '18', nameEn: 'Jijel', nameAr: 'جيجل', communes: [{ nameEn: 'Jijel', nameAr: 'جيجل' }] },
  { code: '19', nameEn: 'Setif', nameAr: 'سطيف', communes: [{ nameEn: 'Setif', nameAr: 'سطيف' }] },
  { code: '20', nameEn: 'Saida', nameAr: 'سعيدة', communes: [{ nameEn: 'Saida', nameAr: 'سعيدة' }] },
  { code: '21', nameEn: 'Skikda', nameAr: 'سكيكدة', communes: [{ nameEn: 'Skikda', nameAr: 'سكيكدة' }] },
  { code: '22', nameEn: 'Sidi Bel Abbes', nameAr: 'سيدي بلعباس', communes: [{ nameEn: 'Sidi Bel Abbes', nameAr: 'سيدي بلعباس' }] },
  { code: '23', nameEn: 'Annaba', nameAr: 'عنابة', communes: [{ nameEn: 'Annaba', nameAr: 'عنابة' }] },
  { code: '24', nameEn: 'Guelma', nameAr: 'قالمة', communes: [{ nameEn: 'Guelma', nameAr: 'قالمة' }] },
  { code: '25', nameEn: 'Constantine', nameAr: 'قسنطينة', communes: [{ nameEn: 'Constantine', nameAr: 'قسنطينة' }] },
  { code: '26', nameEn: 'Medea', nameAr: 'المدية', communes: [{ nameEn: 'Medea', nameAr: 'المدية' }] },
  { code: '27', nameEn: 'Mostaganem', nameAr: 'مستغانم', communes: [{ nameEn: 'Mostaganem', nameAr: 'مستغانم' }] },
  { code: '28', nameEn: "M'Sila", nameAr: 'المسيلة', communes: [{ nameEn: "M'Sila", nameAr: 'المسيلة' }] },
  { code: '29', nameEn: 'Mascara', nameAr: 'معسكر', communes: [{ nameEn: 'Mascara', nameAr: 'معسكر' }] },
  { code: '30', nameEn: 'Ouargla', nameAr: 'ورقلة', communes: [{ nameEn: 'Ouargla', nameAr: 'ورقلة' }] },
  { code: '31', nameEn: 'Oran', nameAr: 'وهران', communes: [{ nameEn: 'Oran', nameAr: 'وهران' }] },
  { code: '32', nameEn: 'El Bayadh', nameAr: 'البيض', communes: [{ nameEn: 'El Bayadh', nameAr: 'البيض' }] },
  { code: '33', nameEn: 'Illizi', nameAr: 'اليزي', communes: [{ nameEn: 'Illizi', nameAr: 'اليزي' }] },
  { code: '34', nameEn: 'Bordj Bou Arreridj', nameAr: 'برج بوعريريج', communes: [{ nameEn: 'Bordj Bou Arreridj', nameAr: 'برج بوعريريج' }] },
  { code: '35', nameEn: 'Boumerdes', nameAr: 'بومرداس', communes: [{ nameEn: 'Boumerdes', nameAr: 'بومرداس' }] },
  { code: '36', nameEn: 'El Tarf', nameAr: 'الطارف', communes: [{ nameEn: 'El Tarf', nameAr: 'الطارف' }] },
  { code: '37', nameEn: 'Tindouf', nameAr: 'تندوف', communes: [{ nameEn: 'Tindouf', nameAr: 'تندوف' }] },
  { code: '38', nameEn: 'Tissemsilt', nameAr: 'تيسمسيلت', communes: [{ nameEn: 'Tissemsilt', nameAr: 'تيسمسيلت' }] },
  { code: '39', nameEn: 'El Oued', nameAr: 'الوادي', communes: [{ nameEn: 'El Oued', nameAr: 'الوادي' }] },
  { code: '40', nameEn: 'Khenchela', nameAr: 'خنشلة', communes: [{ nameEn: 'Khenchela', nameAr: 'خنشلة' }] },
  { code: '41', nameEn: 'Souk Ahras', nameAr: 'سوق اهراس', communes: [{ nameEn: 'Souk Ahras', nameAr: 'سوق اهراس' }] },
  { code: '42', nameEn: 'Tipaza', nameAr: 'تيبازة', communes: [{ nameEn: 'Tipaza', nameAr: 'تيبازة' }] },
  { code: '43', nameEn: 'Mila', nameAr: 'ميلة', communes: [{ nameEn: 'Mila', nameAr: 'ميلة' }] },
  { code: '44', nameEn: 'Ain Defla', nameAr: 'عين الدفلى', communes: [{ nameEn: 'Ain Defla', nameAr: 'عين الدفلى' }] },
  { code: '45', nameEn: 'Naama', nameAr: 'النعامة', communes: [{ nameEn: 'Naama', nameAr: 'النعامة' }] },
  { code: '46', nameEn: 'Ain Temouchent', nameAr: 'عين تموشنت', communes: [{ nameEn: 'Ain Temouchent', nameAr: 'عين تموشنت' }] },
  { code: '47', nameEn: 'Ghardaia', nameAr: 'غرداية', communes: [{ nameEn: 'Ghardaia', nameAr: 'غرداية' }] },
  { code: '48', nameEn: 'Relizane', nameAr: 'غليزان', communes: [{ nameEn: 'Relizane', nameAr: 'غليزان' }] },
  { code: '49', nameEn: 'Timimoun', nameAr: 'تيميمون', communes: [{ nameEn: 'Timimoun', nameAr: 'تيميمون' }] },
  { code: '50', nameEn: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار', communes: [{ nameEn: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار' }] },
  { code: '51', nameEn: 'Ouled Djellal', nameAr: 'اولاد جلال', communes: [{ nameEn: 'Ouled Djellal', nameAr: 'اولاد جلال' }] },
  { code: '52', nameEn: 'Beni Abbes', nameAr: 'بني عباس', communes: [{ nameEn: 'Beni Abbes', nameAr: 'بني عباس' }] },
  { code: '53', nameEn: 'In Salah', nameAr: 'عين صالح', communes: [{ nameEn: 'In Salah', nameAr: 'عين صالح' }] },
  { code: '54', nameEn: 'In Guezzam', nameAr: 'عين قزام', communes: [{ nameEn: 'In Guezzam', nameAr: 'عين قزام' }] },
  { code: '55', nameEn: 'Touggourt', nameAr: 'تقرت', communes: [{ nameEn: 'Touggourt', nameAr: 'تقرت' }] },
  { code: '56', nameEn: 'Djanet', nameAr: 'جانت', communes: [{ nameEn: 'Djanet', nameAr: 'جانت' }] },
  { code: '57', nameEn: "El M'Ghair", nameAr: 'المغير', communes: [{ nameEn: "El M'Ghair", nameAr: 'المغير' }] },
  { code: '58', nameEn: 'El Meniaa', nameAr: 'المنيعة', communes: [{ nameEn: 'El Meniaa', nameAr: 'المنيعة' }] },
];

function normalizeForMatch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]/g, '');
}

export function resolveWilaya(value: string | null | undefined): WilayaOption | undefined {
  const raw = (value ?? '').trim();
  if (!raw) return undefined;

  const codeFromPrefix = raw.match(/^(\d{1,2})/)?.[1];
  if (codeFromPrefix) {
    const normalizedCode = codeFromPrefix.padStart(2, '0');
    const byCode = ALGERIA_WILAYAS.find((item) => item.code === normalizedCode);
    if (byCode) return byCode;
  }

  const normalized = normalizeForMatch(raw);
  return ALGERIA_WILAYAS.find((item) => {
    return (
      normalizeForMatch(item.nameEn) === normalized ||
      normalizeForMatch(item.nameAr) === normalized
    );
  });
}

export function formatWilayaLabel(option: WilayaOption, language: string | undefined) {
  const isArabic = (language ?? '').startsWith('ar');
  return `${option.code} - ${isArabic ? option.nameAr : option.nameEn}`;
}

export function toWilayaStorageValue(value: string | null | undefined) {
  const selected = resolveWilaya(value);
  if (!selected) return (value ?? '').trim();
  return `${selected.code} - ${selected.nameEn}`;
}

export function normalizeCommuneValue(wilayaValue: string | null | undefined, communeValue: string | null | undefined) {
  const commune = (communeValue ?? '').trim();
  if (!commune) return '';

  const selected = resolveWilaya(wilayaValue);
  if (!selected) return commune;

  const normalized = normalizeForMatch(commune);
  const matched = selected.communes.find((item) => {
    return normalizeForMatch(item.nameEn) === normalized || normalizeForMatch(item.nameAr) === normalized;
  });

  return matched?.nameEn ?? commune;
}
