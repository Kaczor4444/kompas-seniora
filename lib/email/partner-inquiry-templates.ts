function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

interface AdminEmailData {
  name: string;
  email: string;
  organization: string;
  partnerType: string;
  phone?: string;
  message: string;
  submittedAt: string;
}

interface UserEmailData {
  name: string;
}

export function getAdminEmailTemplate(data: AdminEmailData): string {
  const partnerTypeLabels = {
    mops: "MOPS / OPS",
    facility: "Placówka (DPS / ŚDS)",
    association: "Stowarzyszenie / Fundacja",
    other: "Inne"
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(to right, #059669, #047857); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #059669; }
    .value { margin-top: 5px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">🤝 Nowe Zapytanie Partnera</h2>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Kompas Seniora</p>
    </div>
    
    <div class="content">
      <div class="field">
        <div class="label">Imię i nazwisko:</div>
        <div class="value">${escapeHtml(data.name)}</div>
      </div>

      <div class="field">
        <div class="label">Email:</div>
        <div class="value"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></div>
      </div>

      <div class="field">
        <div class="label">Organizacja:</div>
        <div class="value">${escapeHtml(data.organization)}</div>
      </div>

      <div class="field">
        <div class="label">Typ partnera:</div>
        <div class="value">${escapeHtml(partnerTypeLabels[data.partnerType as keyof typeof partnerTypeLabels] ?? data.partnerType)}</div>
      </div>

      ${data.phone ? `
      <div class="field">
        <div class="label">Telefon:</div>
        <div class="value"><a href="tel:${escapeHtml(data.phone)}">${escapeHtml(data.phone)}</a></div>
      </div>
      ` : ''}

      <div class="field">
        <div class="label">Wiadomość:</div>
        <div class="value" style="white-space: pre-wrap; background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">${escapeHtml(data.message)}</div>
      </div>

      <div class="field">
        <div class="label">Data zgłoszenia:</div>
        <div class="value">${escapeHtml(data.submittedAt)}</div>
      </div>
      
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/wspolpraca" class="button">
        Zobacz w Panelu Admin
      </a>
    </div>
    
    <div class="footer">
      <p>Ten email został wygenerowany automatycznie przez system Kompas Seniora.</p>
      <p>Odpowiedz bezpośrednio na email partnera: <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getUserEmailTemplate(data: UserEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(to right, #059669, #047857); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .checkmark { font-size: 48px; text-align: center; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">Dziękujemy za Kontakt!</h2>
    </div>
    
    <div class="content">
      <div class="checkmark">✅</div>
      
      <p>Dzień dobry ${escapeHtml(data.name)},</p>
      
      <p>Dziękujemy za zgłoszenie chęci współpracy z Kompasem Seniora!</p>
      
      <p>Otrzymaliśmy Twoją wiadomość i wkrótce się z Tobą skontaktujemy, aby omówić szczegóły współpracy.</p>
      
      <p><strong>Co dalej?</strong></p>
      <ul>
        <li>Odpowiemy w ciągu <strong>2 dni roboczych</strong></li>
        <li>Skontaktujemy się mailem lub telefonicznie (jeśli podałeś numer)</li>
        <li>Omówimy szczegóły współpracy dopasowane do Twoich potrzeb</li>
      </ul>
      
      <p>Jeśli masz dodatkowe pytania, możesz odpowiedzieć na tego maila.</p>
      
      <p>Pozdrawiamy serdecznie,<br>
      <strong>Zespół Kompas Seniora</strong></p>
    </div>
    
    <div class="footer">
      <p>Kompas Seniora - Pomoc w wyborze opieki nad seniorem</p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/polityka-prywatnosci">Polityka Prywatności</a> | 
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/o-nas">O nas</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
