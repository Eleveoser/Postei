/** Regra de senha do Postei: pelo menos 6 caracteres, com letras e números. */
export const REGRA_SENHA = "Use letras + números, com 6 ou mais caracteres.";

export function senhaValida(s: string): boolean {
  return s.length >= 6 && /[A-Za-z]/.test(s) && /\d/.test(s);
}
