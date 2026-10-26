/**
 * Número de WhatsApp da cliente (só um link wa.me: o Postei não usa a API do WhatsApp).
 * Aceita "(11) 91234-5678", "11912345678", "+55 11 91234-5678" ou um link wa.me.
 * Devolve só os dígitos com o 55 na frente, ou null se não parecer um celular/telefone do Brasil.
 */
export function normalizaWhatsapp(entrada: string): string | null {
  const texto = String(entrada ?? "").trim();
  if (!texto) return null;
  const doLink = texto.match(/wa\.me\/(\d{10,15})/i) ?? texto.match(/[?&]phone=(\d{10,15})/i);
  let d = (doLink ? doLink[1] : texto.replace(/\D/g, "")).replace(/^0+/, "");
  // 10 ou 11 dígitos = DDD + número, sem o código do país (inclui o DDD 55 do Rio Grande do Sul)
  if (d.length === 10 || d.length === 11) d = "55" + d;
  return /^55\d{10,11}$/.test(d) ? d : null;
}

export const linkWhatsapp = (digitos: string) => `https://wa.me/${digitos}`;

/** "5511912345678" vira "(11) 91234-5678". */
export function formataWhatsapp(digitos: string): string {
  const n = digitos.replace(/^55/, "");
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return digitos;
}
