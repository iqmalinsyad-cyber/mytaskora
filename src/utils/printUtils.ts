/**
 * Utility for robust, cross-browser and iframe-safe printing and PDF generation
 */

interface PrintDocumentOptions {
  title: string;
  bodyHtml: string;
  customStyles?: string;
}

export const printDocument = ({ title, bodyHtml, customStyles = '' }: PrintDocumentOptions): Promise<void> => {
  return new Promise((resolve) => {
    // Remove any previous print iframes
    const existingFrame = document.getElementById('app-print-frame');
    if (existingFrame) {
      existingFrame.remove();
    }

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'app-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '100%';
    iframe.style.bottom = '100%';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      // Fallback to direct print
      window.print();
      resolve();
      return;
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="ms">
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm 15mm 15mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              font-size: 11px;
              line-height: 1.5;
              color: #0f172a;
              background-color: #ffffff;
              margin: 0;
              padding: 0;
            }
            .header-box {
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 16px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .header-title {
              font-size: 16px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 4px 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .header-subtitle {
              font-size: 11px;
              color: #475569;
              margin: 0;
            }
            .meta-badge {
              display: inline-block;
              font-size: 10px;
              font-weight: 700;
              padding: 4px 8px;
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              color: #334155;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              margin-bottom: 16px;
            }
            .kpi-card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 8px 10px;
              background: #f8fafc;
            }
            .kpi-label {
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 2px;
            }
            .kpi-value {
              font-size: 16px;
              font-weight: 900;
              font-family: monospace;
              color: #0f172a;
            }
            .kpi-desc {
              font-size: 9px;
              color: #475569;
            }
            .section-title {
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              color: #1e293b;
              margin: 14px 0 8px 0;
              border-left: 3px solid #4f46e5;
              padding-left: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              font-size: 10px;
            }
            th {
              background-color: #f1f5f9;
              color: #1e293b;
              font-weight: 800;
              text-align: left;
              padding: 6px 8px;
              border: 1px solid #cbd5e1;
              text-transform: uppercase;
              font-size: 9px;
            }
            td {
              padding: 6px 8px;
              border: 1px solid #e2e8f0;
              vertical-align: top;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .badge-selesai {
              background: #dcfce7;
              color: #166534;
              border: 1px solid #bbf7d0;
            }
            .badge-proses {
              background: #dbeafe;
              color: #1e40af;
              border: 1px solid #bfdbfe;
            }
            .badge-kiv {
              background: #fef3c7;
              color: #92400e;
              border: 1px solid #fde68a;
            }
            .badge-batal {
              background: #ffe4e6;
              color: #9f1239;
              border: 1px solid #fecdd3;
            }
            .footer-info {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #cbd5e1;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 9px;
              color: #64748b;
            }
            .mono-box {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              white-space: pre-wrap;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 12px;
              font-size: 10px;
              line-height: 1.6;
              color: #0f172a;
            }
            ${customStyles}
          </style>
        </head>
        <body>
          ${bodyHtml}
          <div class="footer-info">
            <span>Sistem Pengurusan Aduan & Task · LZS Daerah Hulu Langat</span>
            <span>Dicetak secara automatik daripada Firebase Firestore</span>
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(fullHtml);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        resolve();
      } catch (err) {
        console.error('Iframe print error, falling back to window.print():', err);
        window.print();
        resolve();
      }
    }, 400);
  });
};

/**
 * Print Aduan Cases Report
 */
export const printAduanCasesReport = (cases: any[], workspaceName: string = 'Semua Ruang Kerja') => {
  const total = cases.length;
  const selesaiCount = cases.filter((c) => c.status === 'Selesai').length;
  const dalamSiasatanCount = cases.filter((c) => c.status === 'Dalam Siasatan').length;
  const belumSelesaiCount = cases.filter((c) => c.status === 'Belum Selesai' || c.status === 'Belum Disahkan').length;
  const kivCount = cases.filter((c) => c.status === 'Perlu Maklumat (KIV)' || c.status === 'Perlu Maklumat').length;
  const ditolakCount = cases.filter((c) => c.status === 'Ditolak').length;

  const telahDiprosesCount = cases.filter((c) => c.tindakan === 'Telah Diproses').length;
  const kivTindakanCount = cases.filter((c) => c.tindakan === 'KIV').length;
  const belumDiprosesCount = cases.filter((c) => c.tindakan === 'Belum Di Proses' || !c.tindakan).length;

  const completionRate = total > 0 ? Math.round((selesaiCount / total) * 100) : 0;
  const reportDate = new Date().toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const tableRows = cases
    .map((c, idx) => {
      let badgeClass = 'badge-kiv';
      if (c.status === 'Selesai') badgeClass = 'badge-selesai';
      else if (c.status === 'Dalam Siasatan') badgeClass = 'badge-proses';
      else if (c.status === 'Ditolak') badgeClass = 'badge-batal';

      return `
        <tr>
          <td style="text-align: center; font-family: monospace;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold; color: #4338ca;">${c.noRujukan || '-'}</td>
          <td>
            <strong>${c.namaPengadu || '-'}</strong>
            ${c.telefonPengadu ? `<div style="color: #64748b; font-size: 9px;">${c.telefonPengadu}</div>` : ''}
            ${c.alamat ? `<div style="color: #475569; font-size: 9px; margin-top: 2px;">${c.alamat}</div>` : ''}
          </td>
          <td>
            <div>${c.kategori || '-'}</div>
            <span style="font-size: 8px; color: #475569; background: #e2e8f0; padding: 1px 4px; border-radius: 3px;">${c.sumberAduan || 'Awam'}</span>
          </td>
          <td><span class="badge ${badgeClass}">${c.status || '-'}</span></td>
          <td><strong>${c.tindakan || 'Belum Di Proses'}</strong></td>
          <td style="white-space: nowrap;">${c.tarikhAduan ? new Date(c.tarikhAduan).toLocaleDateString('ms-MY') : '-'}</td>
        </tr>
      `;
    })
    .join('');

  const bodyHtml = `
    <div class="header-box">
      <div>
        <h1 class="header-title">Laporan Terkini Kes Aduan</h1>
        <p class="header-subtitle">Lembaga Zakat Selangor (LZS) · Ruang Kerja: <strong>${workspaceName}</strong></p>
      </div>
      <div style="text-align: right;">
        <span class="meta-badge">Tarikh Jana: ${reportDate}</span>
        <div style="font-size: 9px; color: #64748b; margin-top: 4px;">Jumlah Rekod: <strong>${total} Kes</strong></div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Jumlah Kes</div>
        <div class="kpi-value">${total}</div>
        <div class="kpi-desc">Keseluruhan data aduan</div>
      </div>
      <div class="kpi-card" style="background: #f0fdf4; border-color: #bbf7d0;">
        <div class="kpi-label" style="color: #166534;">Kes Selesai</div>
        <div class="kpi-value" style="color: #166534;">${selesaiCount}</div>
        <div class="kpi-desc" style="color: #15803d; font-weight: bold;">${completionRate}% kadar siap</div>
      </div>
      <div class="kpi-card" style="background: #eff6ff; border-color: #bfdbfe;">
        <div class="kpi-label" style="color: #1e40af;">Dalam Siasatan</div>
        <div class="kpi-value" style="color: #1e40af;">${dalamSiasatanCount}</div>
        <div class="kpi-desc" style="color: #1d4ed8;">Sedang disiasat</div>
      </div>
      <div class="kpi-card" style="background: #fefce8; border-color: #fef08a;">
        <div class="kpi-label" style="color: #854d0e;">Belum Selesai / KIV</div>
        <div class="kpi-value" style="color: #854d0e;">${belumSelesaiCount + kivCount}</div>
        <div class="kpi-desc" style="color: #a16207;">${telahDiprosesCount} telah diproses</div>
      </div>
    </div>

    <div class="section-title">Senarai Terperinci Kes Aduan (${total})</div>
    <table>
      <thead>
        <tr>
          <th style="width: 30px; text-align: center;">Bil</th>
          <th style="width: 100px;">No Rujukan</th>
          <th>Nama Pengadu & Maklumat</th>
          <th style="width: 120px;">Kategori & Sumber</th>
          <th style="width: 95px;">Status</th>
          <th style="width: 105px;">Tindakan</th>
          <th style="width: 75px;">Tarikh</th>
        </tr>
      </thead>
      <tbody>
        ${cases.length === 0 ? '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #94a3b8;">Tiada rekod aduan untuk dicetak.</td></tr>' : tableRows}
      </tbody>
    </table>
  `;

  return printDocument({
    title: `Laporan_Aduan_${new Date().toISOString().split('T')[0]}`,
    bodyHtml,
  });
};

/**
 * Print Task Management Report
 */
export const printTaskReport = (tasks: any[], workspaceName: string = 'Pengurusan Task') => {
  const total = tasks.length;
  const selesaiCount = tasks.filter((t) => t.status === 'Selesai').length;
  const dalamProsesCount = tasks.filter((t) => t.status === 'Dalam Proses').length;
  const batalCount = tasks.filter((t) => t.status === 'Batal').length;
  const adaTempohCount = tasks.filter((t) => t.adaTempoh === 'Ada').length;

  const completionRate = total > 0 ? Math.round((selesaiCount / total) * 100) : 0;
  const reportDate = new Date().toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const tableRows = tasks
    .map((t, idx) => {
      let badgeClass = 'badge-proses';
      if (t.status === 'Selesai') badgeClass = 'badge-selesai';
      else if (t.status === 'Batal') badgeClass = 'badge-batal';

      return `
        <tr>
          <td style="text-align: center; font-family: monospace;">${idx + 1}</td>
          <td>
            <strong>${t.namaTask || '-'}</strong>
            ${t.keterangan ? `<div style="color: #475569; font-size: 9px; margin-top: 2px;">${t.keterangan}</div>` : ''}
          </td>
          <td><span class="badge ${badgeClass}">${t.status || '-'}</span></td>
          <td>${t.adaTempoh === 'Ada' && t.tempoh ? `<strong>${t.tempoh}</strong>` : '<span style="color: #94a3b8;">Tiada Tempoh</span>'}</td>
          <td>${t.createdBy || 'Staf'}</td>
          <td>${t.catatan || '-'}</td>
          <td style="white-space: nowrap;">${t.tarikhDicipta ? new Date(t.tarikhDicipta).toLocaleDateString('ms-MY') : '-'}</td>
        </tr>
      `;
    })
    .join('');

  const bodyHtml = `
    <div class="header-box">
      <div>
        <h1 class="header-title">Laporan Terkini Pengurusan Task</h1>
        <p class="header-subtitle">Lembaga Zakat Selangor (LZS) · Ruang Kerja: <strong>${workspaceName}</strong></p>
      </div>
      <div style="text-align: right;">
        <span class="meta-badge">Tarikh Jana: ${reportDate}</span>
        <div style="font-size: 9px; color: #64748b; margin-top: 4px;">Jumlah: <strong>${total} Tugasan</strong></div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Jumlah Task</div>
        <div class="kpi-value">${total}</div>
        <div class="kpi-desc">Keseluruhan task aktif</div>
      </div>
      <div class="kpi-card" style="background: #f0fdf4; border-color: #bbf7d0;">
        <div class="kpi-label" style="color: #166534;">Task Selesai</div>
        <div class="kpi-value" style="color: #166534;">${selesaiCount}</div>
        <div class="kpi-desc" style="color: #15803d; font-weight: bold;">${completionRate}% kadar siap</div>
      </div>
      <div class="kpi-card" style="background: #eff6ff; border-color: #bfdbfe;">
        <div class="kpi-label" style="color: #1e40af;">Dalam Proses</div>
        <div class="kpi-value" style="color: #1e40af;">${dalamProsesCount}</div>
        <div class="kpi-desc" style="color: #1d4ed8;">Sedang dijalankan</div>
      </div>
      <div class="kpi-card" style="background: #fefce8; border-color: #fef08a;">
        <div class="kpi-label" style="color: #854d0e;">Task Bertempoh</div>
        <div class="kpi-value" style="color: #854d0e;">${adaTempohCount}</div>
        <div class="kpi-desc" style="color: #a16207;">Jadual khas ditetapkan</div>
      </div>
    </div>

    <div class="section-title">Senarai Terperinci Tugasan (${total})</div>
    <table>
      <thead>
        <tr>
          <th style="width: 30px; text-align: center;">Bil</th>
          <th>Nama Task & Keterangan</th>
          <th style="width: 95px;">Status</th>
          <th style="width: 90px;">Tempoh</th>
          <th style="width: 90px;">Pencipta</th>
          <th>Catatan</th>
          <th style="width: 75px;">Tarikh</th>
        </tr>
      </thead>
      <tbody>
        ${tasks.length === 0 ? '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #94a3b8;">Tiada rekod tugasan untuk dicetak.</td></tr>' : tableRows}
      </tbody>
    </table>
  `;

  return printDocument({
    title: `Laporan_Task_${new Date().toISOString().split('T')[0]}`,
    bodyHtml,
  });
};

/**
 * Print Investigation Report (Laporan Siasatan Aduan)
 */
export const printSiasatanReport = (name: string, formattedText: string) => {
  const reportDate = new Date().toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const escapedText = formattedText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const bodyHtml = `
    <div class="header-box">
      <div>
        <h1 class="header-title">LEMBAGA ZAKAT SELANGOR (LZS)</h1>
        <p class="header-subtitle">DAERAH HULU LANGAT · LAPORAN SIASATAN KES ADUAN</p>
      </div>
      <div style="text-align: right;">
        <span class="meta-badge">Tarikh Cetak: ${reportDate}</span>
      </div>
    </div>

    <div class="mono-box">${escapedText}</div>
  `;

  return printDocument({
    title: `Laporan_Siasatan_${name ? name.replace(/\s+/g, '_') : 'LZS'}_${new Date().toISOString().split('T')[0]}`,
    bodyHtml,
  });
};
