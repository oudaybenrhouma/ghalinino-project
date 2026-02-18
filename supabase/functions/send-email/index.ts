/**
 * send-email Edge Function
 * Ghalinino — Tunisia E-commerce
 *
 * Handles all transactional emails via Resend.
 *
 * Supported event types:
 *  - order_confirmed        → customer: order confirmation
 *  - order_shipped          → customer: order shipped
 *  - order_cancelled        → customer: order cancelled
 *  - new_order_admin        → admin: new order placed
 *  - wholesale_approved     → customer: wholesale account approved
 *  - wholesale_rejected     → customer: wholesale application rejected
 *
 * Environment variables required:
 *  - RESEND_API_KEY
 *  - ADMIN_EMAIL           (e.g. store@ghalinino.com)
 *  - APP_URL               (e.g. https://ghalinino.com)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Brand colours ────────────────────────────────────────────────────────────
const BRAND = {
  primary: "#1e3a5f",     // deep navy
  accent:  "#c8a96e",     // warm gold
  bg:      "#f9f6f1",     // warm off-white
  text:    "#2d2d2d",
  muted:   "#6b7280",
  border:  "#e5ddd0",
};

// ─── Shared HTML helpers ──────────────────────────────────────────────────────

function shell(title: string, bodyHtml: string, lang: "ar" | "fr" = "fr"): string {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const fontFamily = lang === "ar"
    ? "'Segoe UI', Tahoma, Arial, sans-serif"
    : "'Segoe UI', Helvetica, Arial, sans-serif";

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:${fontFamily};color:${BRAND.text};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;border:1px solid ${BRAND.border};overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:${BRAND.primary};padding:28px 40px;text-align:${lang === "ar" ? "right" : "left"};">
            <span style="font-size:22px;font-weight:700;color:#fff;letter-spacing:0.5px;">غالي نينو</span>
            <span style="font-size:14px;color:${BRAND.accent};margin-${lang === "ar" ? "right" : "left"}:10px;">Ghalinino</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:${BRAND.bg};border-top:1px solid ${BRAND.border};padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:${BRAND.muted};">
              Ghalinino · Tunisia
              &nbsp;|&nbsp;
              <a href="mailto:support@ghalinino.com" style="color:${BRAND.accent};text-decoration:none;">support@ghalinino.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function h1(text: string, lang: "ar" | "fr" = "fr") {
  return `<h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:${BRAND.primary};text-align:${lang === "ar" ? "right" : "left"};">${text}</h1>`;
}

function p(text: string, lang: "ar" | "fr" = "fr") {
  return `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${BRAND.text};text-align:${lang === "ar" ? "right" : "left"};">${text}</p>`;
}

function btn(label: string, url: string) {
  return `<div style="margin:24px 0;">
    <a href="${url}" style="display:inline-block;background:${BRAND.primary};color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:600;font-size:15px;">${label}</a>
  </div>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid ${BRAND.border};margin:24px 0;" />`;
}

function orderTable(items: OrderItem[], totals: Totals, lang: "ar" | "fr") {
  const rows = items.map(it => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid ${BRAND.border};font-size:14px;text-align:${lang === "ar" ? "right" : "left"};">${lang === "ar" ? it.name_ar : it.name_fr}</td>
      <td style="padding:10px 12px;border-bottom:1px solid ${BRAND.border};font-size:14px;text-align:center;">${it.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid ${BRAND.border};font-size:14px;text-align:${lang === "ar" ? "left" : "right"};">${it.unit_price.toFixed(3)} TND</td>
    </tr>`).join("");

  const shippingLabel  = lang === "ar" ? "الشحن"   : "Livraison";
  const totalLabel     = lang === "ar" ? "الإجمالي" : "Total";
  const productLabel   = lang === "ar" ? "المنتج"   : "Produit";
  const qtyLabel       = lang === "ar" ? "الكمية"   : "Qté";
  const priceLabel     = lang === "ar" ? "السعر"    : "Prix";

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.border};border-radius:8px;border-collapse:collapse;margin:20px 0;font-size:14px;">
    <thead>
      <tr style="background:${BRAND.bg};">
        <th style="padding:10px 12px;text-align:${lang === "ar" ? "right" : "left"};font-weight:600;color:${BRAND.primary};">${productLabel}</th>
        <th style="padding:10px 12px;text-align:center;font-weight:600;color:${BRAND.primary};">${qtyLabel}</th>
        <th style="padding:10px 12px;text-align:${lang === "ar" ? "left" : "right"};font-weight:600;color:${BRAND.primary};">${priceLabel}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="padding:10px 12px;text-align:${lang === "ar" ? "right" : "left"};font-size:13px;color:${BRAND.muted};">${shippingLabel}</td>
        <td style="padding:10px 12px;text-align:${lang === "ar" ? "left" : "right"};font-size:13px;">${totals.shippingFee.toFixed(3)} TND</td>
      </tr>
      <tr style="background:${BRAND.bg};">
        <td colspan="2" style="padding:12px;text-align:${lang === "ar" ? "right" : "left"};font-weight:700;color:${BRAND.primary};font-size:15px;">${totalLabel}</td>
        <td style="padding:12px;text-align:${lang === "ar" ? "left" : "right"};font-weight:700;color:${BRAND.primary};font-size:15px;">${totals.total.toFixed(3)} TND</td>
      </tr>
    </tfoot>
  </table>`;
}

function infoBox(rows: [string, string][], lang: "ar" | "fr") {
  const cells = rows.map(([label, value]) => `
    <tr>
      <td style="padding:8px 12px;font-size:13px;color:${BRAND.muted};white-space:nowrap;text-align:${lang === "ar" ? "right" : "left"};">${label}</td>
      <td style="padding:8px 12px;font-size:14px;font-weight:500;text-align:${lang === "ar" ? "left" : "right"};">${value}</td>
    </tr>`).join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:8px;border-collapse:collapse;margin:16px 0;">${cells}</table>`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  name_ar: string;
  name_fr: string;
  quantity: number;
  unit_price: number;
}

interface Totals {
  subtotal: number;
  shippingFee: number;
  total: number;
}

interface OrderConfirmedPayload {
  to: string;
  customerName: string;
  orderId: string;
  orderNumber: string;
  paymentMethod: "cod" | "bank_transfer" | "flouci";
  items: OrderItem[];
  totals: Totals;
  shippingAddress: {
    addressLine1: string;
    city: string;
    governorate: string;
  };
  lang?: "ar" | "fr";
}

interface OrderShippedPayload {
  to: string;
  customerName: string;
  orderId: string;
  orderNumber: string;
  lang?: "ar" | "fr";
}

interface OrderCancelledPayload {
  to: string;
  customerName: string;
  orderId: string;
  orderNumber: string;
  lang?: "ar" | "fr";
}

interface NewOrderAdminPayload {
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerContact: string; // email or phone
  paymentMethod: string;
  total: number;
  itemCount: number;
}

interface WholesaleApprovedPayload {
  to: string;
  customerName: string;
}

interface WholesaleRejectedPayload {
  to: string;
  customerName: string;
  reason?: string;
}

// ─── Email builders ───────────────────────────────────────────────────────────

function buildOrderConfirmed(p: OrderConfirmedPayload): { subject: string; html: string } {
  const lang = p.lang ?? "fr";
  const appUrl = Deno.env.get("APP_URL") ?? "https://ghalinino.com";
  const orderUrl = `${appUrl}/account/orders/${p.orderId}`;

  const paymentLabels: Record<string, { ar: string; fr: string }> = {
    cod:           { ar: "الدفع عند الاستلام",  fr: "Paiement à la livraison" },
    bank_transfer: { ar: "تحويل بنكي",           fr: "Virement bancaire" },
    flouci:        { ar: "فلوسي",                fr: "Flouci" },
  };
  const pmLabel = paymentLabels[p.paymentMethod]?.[lang] ?? p.paymentMethod;

  if (lang === "ar") {
    const bankNote = p.paymentMethod === "bank_transfer"
      ? `<div style="background:#fff8e8;border:1px solid #f0d080;border-radius:8px;padding:16px;margin:16px 0;text-align:right;">
           <strong>⚠️ خطوة مهمة</strong><br/>
           <span style="font-size:14px;">يرجى إتمام التحويل البنكي وإرفاق إيصال الدفع عبر صفحة طلبك.</span>
         </div>`
      : "";

    return {
      subject: `تأكيد الطلب #${p.orderNumber} — غالي نينو`,
      html: shell(`تأكيد الطلب #${p.orderNumber}`, `
        ${h1(`شكراً لك، ${p.customerName}! 🎉`, "ar")}
        ${p("تم استلام طلبك بنجاح. سنبدأ في تجهيزه قريباً.", "ar")}
        ${bankNote}
        ${infoBox([
          ["رقم الطلب", `#${p.orderNumber}`],
          ["طريقة الدفع", pmLabel],
          ["عنوان التوصيل", `${p.shippingAddress.addressLine1}، ${p.shippingAddress.city}`],
        ], "ar")}
        ${orderTable(p.items, p.totals, "ar")}
        ${btn("عرض تفاصيل الطلب", orderUrl)}
        ${divider()}
        ${p("لأي استفسار، تواصل معنا على <a href='mailto:support@ghalinino.com' style='color:${BRAND.accent};'>support@ghalinino.com</a>", "ar")}
      `, "ar"),
    };
  }

  const bankNote = p.paymentMethod === "bank_transfer"
    ? `<div style="background:#fff8e8;border:1px solid #f0d080;border-radius:8px;padding:16px;margin:16px 0;">
         <strong>⚠️ Action requise</strong><br/>
         <span style="font-size:14px;">Merci d'effectuer le virement bancaire et de joindre votre preuve de paiement depuis votre page de commande.</span>
       </div>`
    : "";

  return {
    subject: `Confirmation de commande #${p.orderNumber} — Ghalinino`,
    html: shell(`Commande #${p.orderNumber} confirmée`, `
      ${h1(`Merci, ${p.customerName} ! 🎉`, "fr")}
      ${p("Votre commande a bien été reçue. Nous allons commencer à la préparer très bientôt.", "fr")}
      ${bankNote}
      ${infoBox([
        ["Numéro de commande", `#${p.orderNumber}`],
        ["Paiement", pmLabel],
        ["Adresse de livraison", `${p.shippingAddress.addressLine1}, ${p.shippingAddress.city}`],
      ], "fr")}
      ${orderTable(p.items, p.totals, "fr")}
      ${btn("Voir ma commande", orderUrl)}
      ${divider()}
      ${p("Des questions ? Écrivez-nous à <a href='mailto:support@ghalinino.com' style='color:${BRAND.accent};'>support@ghalinino.com</a>", "fr")}
    `, "fr"),
  };
}

function buildOrderShipped(p: OrderShippedPayload): { subject: string; html: string } {
  const lang = p.lang ?? "fr";
  const appUrl = Deno.env.get("APP_URL") ?? "https://ghalinino.com";
  const orderUrl = `${appUrl}/account/orders/${p.orderId}`;

  if (lang === "ar") {
    return {
      subject: `طلبك #${p.orderNumber} في الطريق إليك! 🚚`,
      html: shell(`الطلب #${p.orderNumber} — تم الشحن`, `
        ${h1(`طلبك في الطريق، ${p.customerName}! 🚚`, "ar")}
        ${p("تمت معالجة طلبك وهو الآن في طريقه إليك. ستتلقى إشعاراً عند التوصيل.", "ar")}
        ${infoBox([["رقم الطلب", `#${p.orderNumber}`]], "ar")}
        ${btn("تتبع طلبي", orderUrl)}
      `, "ar"),
    };
  }

  return {
    subject: `Votre commande #${p.orderNumber} est en route ! 🚚`,
    html: shell(`Commande #${p.orderNumber} expédiée`, `
      ${h1(`En route vers chez vous, ${p.customerName} ! 🚚`, "fr")}
      ${p("Votre commande a été expédiée et est en cours d'acheminement. Vous recevrez une notification à la livraison.", "fr")}
      ${infoBox([["Numéro de commande", `#${p.orderNumber}`]], "fr")}
      ${btn("Suivre ma commande", orderUrl)}
    `, "fr"),
  };
}

function buildOrderCancelled(p: OrderCancelledPayload): { subject: string; html: string } {
  const lang = p.lang ?? "fr";

  if (lang === "ar") {
    return {
      subject: `تم إلغاء الطلب #${p.orderNumber}`,
      html: shell(`إلغاء الطلب #${p.orderNumber}`, `
        ${h1(`تم إلغاء طلبك`, "ar")}
        ${p(`${p.customerName}، نأسف لإبلاغك بأنه تم إلغاء طلبك رقم <strong>#${p.orderNumber}</strong>.`, "ar")}
        ${p("إذا كنت قد دفعت مسبقاً، سيتم استرداد المبلغ خلال 3–5 أيام عمل. للاستفسار: <a href='mailto:support@ghalinino.com' style='color:${BRAND.accent};'>support@ghalinino.com</a>", "ar")}
      `, "ar"),
    };
  }

  return {
    subject: `Commande #${p.orderNumber} annulée`,
    html: shell(`Commande #${p.orderNumber} annulée`, `
      ${h1(`Votre commande a été annulée`, "fr")}
      ${p(`${p.customerName}, nous vous informons que votre commande <strong>#${p.orderNumber}</strong> a été annulée.`, "fr")}
      ${p("Si vous avez déjà effectué un paiement, le remboursement sera traité sous 3 à 5 jours ouvrables. Pour toute question : <a href='mailto:support@ghalinino.com' style='color:${BRAND.accent};'>support@ghalinino.com</a>", "fr")}
    `, "fr"),
  };
}

function buildNewOrderAdmin(p: NewOrderAdminPayload): { subject: string; html: string } {
  const appUrl = Deno.env.get("APP_URL") ?? "https://ghalinino.com";
  const adminUrl = `${appUrl}/admin/orders/${p.orderId}`;

  const pmLabels: Record<string, string> = {
    cod: "Cash on Delivery",
    bank_transfer: "Bank Transfer",
    flouci: "Flouci",
  };

  return {
    subject: `🛍️ New Order #${p.orderNumber} — ${p.total.toFixed(3)} TND`,
    html: shell("New Order Alert", `
      ${h1(`New order placed! 🛍️`, "fr")}
      ${infoBox([
        ["Order #",   p.orderNumber],
        ["Customer",  p.customerName],
        ["Contact",   p.customerContact],
        ["Payment",   pmLabels[p.paymentMethod] ?? p.paymentMethod],
        ["Items",     String(p.itemCount)],
        ["Total",     `${p.total.toFixed(3)} TND`],
      ], "fr")}
      ${btn("View Order in Admin", adminUrl)}
    `, "fr"),
  };
}

function buildWholesaleApproved(p: WholesaleApprovedPayload): { subject: string; html: string } {
  const appUrl = Deno.env.get("APP_URL") ?? "https://ghalinino.com";
  return {
    subject: "✅ Votre compte grossiste Ghalinino est approuvé !",
    html: shell("Compte grossiste approuvé", `
      ${h1(`Félicitations, ${p.customerName} ! 🎉`, "fr")}
      ${p("Votre demande de compte grossiste a été <strong>approuvée</strong>. Vous avez maintenant accès aux tarifs et conditions réservés aux grossistes.", "fr")}
      ${p("Connectez-vous dès maintenant pour commencer vos achats aux prix préférentiels.", "fr")}
      ${btn("Accéder à mon compte", `${appUrl}/login`)}
      ${divider()}
      ${p("Questions ? <a href='mailto:support@ghalinino.com' style='color:${BRAND.accent};'>support@ghalinino.com</a>", "fr")}
    `, "fr"),
  };
}

function buildWholesaleRejected(p: WholesaleRejectedPayload): { subject: string; html: string } {
  const reasonBlock = p.reason
    ? infoBox([["Motif", p.reason]], "fr")
    : "";
  return {
    subject: "Votre demande de compte grossiste Ghalinino",
    html: shell("Demande grossiste", `
      ${h1(`Suite à votre demande`, "fr")}
      ${p(`${p.customerName}, après examen de votre dossier, nous ne sommes malheureusement pas en mesure d'approuver votre demande de compte grossiste pour le moment.`, "fr")}
      ${reasonBlock}
      ${p("Vous pouvez continuer à commander normalement sur notre boutique. Pour toute question : <a href='mailto:support@ghalinino.com' style='color:${BRAND.accent};'>support@ghalinino.com</a>", "fr")}
    `, "fr"),
  };
}

// ─── Resend sender ────────────────────────────────────────────────────────────

async function sendViaResend(to: string, subject: string, html: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const fromAddress = Deno.env.get("FROM_EMAIL") ?? "Ghalinino <noreply@ghalinino.com>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: fromAddress, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { event, payload } = await req.json();

    if (!event || !payload) {
      return new Response(JSON.stringify({ error: "Missing event or payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminEmail = Deno.env.get("ADMIN_EMAIL") ?? "admin@ghalinino.com";

    switch (event) {
      case "order_confirmed": {
        const { subject, html } = buildOrderConfirmed(payload as OrderConfirmedPayload);
        await sendViaResend(payload.to, subject, html);
        break;
      }
      case "order_shipped": {
        const { subject, html } = buildOrderShipped(payload as OrderShippedPayload);
        await sendViaResend(payload.to, subject, html);
        break;
      }
      case "order_cancelled": {
        const { subject, html } = buildOrderCancelled(payload as OrderCancelledPayload);
        await sendViaResend(payload.to, subject, html);
        break;
      }
      case "new_order_admin": {
        const { subject, html } = buildNewOrderAdmin(payload as NewOrderAdminPayload);
        await sendViaResend(adminEmail, subject, html);
        break;
      }
      case "wholesale_approved": {
        const { subject, html } = buildWholesaleApproved(payload as WholesaleApprovedPayload);
        await sendViaResend(payload.to, subject, html);
        break;
      }
      case "wholesale_rejected": {
        const { subject, html } = buildWholesaleRejected(payload as WholesaleRejectedPayload);
        await sendViaResend(payload.to, subject, html);
        break;
      }
      default:
        return new Response(JSON.stringify({ error: `Unknown event: ${event}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("send-email error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});