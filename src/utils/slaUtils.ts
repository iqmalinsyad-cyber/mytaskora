import { AduanCase } from '../types';

export type SlaTierType = 'STRETCH' | 'TARGET' | 'THRESHOLD' | 'TIDAK_PATUH';

export interface SlaCalculationResult {
  elapsedHours: number;
  category: 'under_48h' | 'under_72h' | 'under_96h' | 'over_96h';
  tierName: 'STRETCH' | 'TARGET' | 'THRESHOLD' | 'Tidak Patuh yang ditetapkan';
  tierLabel: '< 48 Jam (STRETCH)' | '< 72 Jam (TARGET)' | '< 96 Jam (THRESHOLD)' | '> 96 Jam (Tidak Patuh yang ditetapkan)';
  shortLabel: string;
  isCompliant: boolean;
  statusText: string;
  badgeClass: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  fullColorBg: string;
  fullColorText: string;
  isCompleted: boolean;
}

export interface SlaPerformanceSummary {
  total: number;
  under48hCount: number; // STRETCH (< 48 Jam)
  under72hCount: number; // TARGET (< 72 Jam)
  under96hCount: number; // THRESHOLD (< 96 Jam)
  over96hCount: number; // Tidak patuh yang ditetapkan (> 96 Jam)
  compliantCount: number; // <= 96 jam
  nonCompliantCount: number; // > 96 jam
  complianceRate: number; // percentage <= 96 jam
  avgElapsedHours: number;
}

/**
 * Kira status dan prestasi SLA bagi sesuatu kes aduan
 * Piawaian Baharu 4 Peringkat:
 * 1. < 48 Jam: STRETCH
 * 2. < 72 Jam: TARGET
 * 3. < 96 Jam: THRESHOLD
 * 4. > 96 Jam: Tidak Patuh yang ditetapkan (melebihi tempoh kelayakan piawaian SLA)
 */
export const calculateCaseSLA = (aduan: AduanCase): SlaCalculationResult => {
  const isCompleted = aduan.status === 'Selesai';
  
  // Waktu mula pendaftaran aduan
  const startTime = new Date(aduan.tarikhAduan || aduan.updatedAt || Date.now()).getTime();
  
  // Waktu selesai atau waktu semasa jika belum selesai
  const endTime = isCompleted
    ? (aduan.tarikhSelesai ? new Date(aduan.tarikhSelesai).getTime() : new Date(aduan.updatedAt || Date.now()).getTime())
    : Date.now();

  const elapsedMs = Math.max(0, endTime - startTime);
  const elapsedHours = Math.round(elapsedMs / (1000 * 60 * 60));

  if (elapsedHours < 48) {
    return {
      elapsedHours,
      category: 'under_48h',
      tierName: 'STRETCH',
      tierLabel: '< 48 Jam (STRETCH)',
      shortLabel: `${elapsedHours}j (STRETCH)`,
      isCompliant: true,
      statusText: isCompleted ? `Selesai ${elapsedHours}j (<48j · STRETCH)` : `Aktif ${elapsedHours}j (<48j · STRETCH)`,
      badgeClass: 'badge-sla-48',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
      fullColorBg: 'from-emerald-600 to-teal-700',
      fullColorText: 'text-white',
      isCompleted,
    };
  } else if (elapsedHours < 72) {
    return {
      elapsedHours,
      category: 'under_72h',
      tierName: 'TARGET',
      tierLabel: '< 72 Jam (TARGET)',
      shortLabel: `${elapsedHours}j (TARGET)`,
      isCompliant: true,
      statusText: isCompleted ? `Selesai ${elapsedHours}j (<72j · TARGET)` : `Aktif ${elapsedHours}j (<72j · TARGET)`,
      badgeClass: 'badge-sla-72',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      badgeBorder: 'border-blue-200',
      fullColorBg: 'from-blue-600 to-indigo-700',
      fullColorText: 'text-white',
      isCompleted,
    };
  } else if (elapsedHours <= 96) {
    return {
      elapsedHours,
      category: 'under_96h',
      tierName: 'THRESHOLD',
      tierLabel: '< 96 Jam (THRESHOLD)',
      shortLabel: `${elapsedHours}j (THRESHOLD)`,
      isCompliant: true,
      statusText: isCompleted ? `Selesai ${elapsedHours}j (<96j · THRESHOLD)` : `Aktif ${elapsedHours}j (<96j · THRESHOLD)`,
      badgeClass: 'badge-sla-96',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      badgeBorder: 'border-amber-200',
      fullColorBg: 'from-amber-500 to-orange-600',
      fullColorText: 'text-white',
      isCompleted,
    };
  } else {
    // Lebih daripada 96 jam => Tidak Patuh yang ditetapkan
    return {
      elapsedHours,
      category: 'over_96h',
      tierName: 'Tidak Patuh yang ditetapkan',
      tierLabel: '> 96 Jam (Tidak Patuh yang ditetapkan)',
      shortLabel: `${elapsedHours}j (>96j Tidak Patuh)`,
      isCompliant: false,
      statusText: isCompleted ? `Selesai ${elapsedHours}j (>96j · Tidak Patuh)` : `Aktif ${elapsedHours}j (>96j · Melebihi Tempoh SLA)`,
      badgeClass: 'badge-sla-over',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200',
      fullColorBg: 'from-rose-600 to-red-700',
      fullColorText: 'text-white',
      isCompleted,
    };
  }
};

/**
 * Ringkasan statistik prestasi SLA untuk senarai kes
 */
export const calculateSlaPerformanceSummary = (cases: AduanCase[]): SlaPerformanceSummary => {
  const total = cases.length;
  if (total === 0) {
    return {
      total: 0,
      under48hCount: 0,
      under72hCount: 0,
      under96hCount: 0,
      over96hCount: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      complianceRate: 100,
      avgElapsedHours: 0,
    };
  }

  let under48hCount = 0;
  let under72hCount = 0;
  let under96hCount = 0;
  let over96hCount = 0;
  let totalHours = 0;

  cases.forEach((c) => {
    const sla = calculateCaseSLA(c);
    totalHours += sla.elapsedHours;

    if (sla.category === 'under_48h') {
      under48hCount++;
    } else if (sla.category === 'under_72h') {
      under72hCount++;
    } else if (sla.category === 'under_96h') {
      under96hCount++;
    } else {
      over96hCount++;
    }
  });

  const compliantCount = under48hCount + under72hCount + under96hCount;
  const nonCompliantCount = over96hCount;
  const complianceRate = Math.round((compliantCount / total) * 100);
  const avgElapsedHours = Math.round(totalHours / total);

  return {
    total,
    under48hCount,
    under72hCount,
    under96hCount,
    over96hCount,
    compliantCount,
    nonCompliantCount,
    complianceRate,
    avgElapsedHours,
  };
};
