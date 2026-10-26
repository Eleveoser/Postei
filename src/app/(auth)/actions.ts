"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { REGRA_SENHA, senhaValida } from "./senha";

async function origem() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const para = (caminho: string, params: Record<string, string>) =>
  `${caminho}?${new URLSearchParams(params).toString()}`;

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const nomeNegocio = String(formData.get("nome_negocio") || "").trim();

  if (!email || !password || !nomeNegocio) {
    redirect(para("/cadastro", { erro: "Preencha todos os campos." }));
  }
  if (!senhaValida(password)) {
    redirect(para("/cadastro", { erro: `Senha fraca. ${REGRA_SENHA}` }));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome_negocio: nomeNegocio },
      emailRedirectTo: `${await origem()}/auth/callback?next=/app/marca`,
    },
  });

  if (error) {
    const msg = /already|registered/i.test(error.message)
      ? "Este e-mail já tem conta. Entre ou redefina a senha."
      : "Não consegui criar a conta agora. Confira o e-mail e tente de novo.";
    redirect(para("/cadastro", { erro: msg }));
  }

  // Com confirmação de e-mail ligada no Supabase, a conta nasce sem sessão.
  if (!data.session) redirect(para("/cadastro/confirmar", { email }));

  redirect("/app/marca");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      redirect(para("/cadastro/confirmar", { email, pendente: "1" }));
    }
    redirect(para("/login", { erro: "E-mail ou senha incorretos.", email }));
  }

  redirect("/app");
}

export async function reenviarConfirmacao(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) redirect("/cadastro");
  const supabase = await createClient();
  await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${await origem()}/auth/callback?next=/app/marca` },
  });
  redirect(para("/cadastro/confirmar", { email, reenviado: "1" }));
}

export async function pedirRedefinicao(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) redirect(para("/esqueci-senha", { erro: "Escreva o seu e-mail." }));
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origem()}/auth/callback?next=/redefinir-senha`,
  });
  // Mesma resposta exista a conta ou não, para não revelar quem é cliente.
  redirect(para("/esqueci-senha", { enviado: "1", email }));
}

export async function redefinirSenha(formData: FormData) {
  const password = String(formData.get("password") || "");
  const igual = String(formData.get("password2") || "");
  if (!senhaValida(password)) redirect(para("/redefinir-senha", { erro: `Senha fraca. ${REGRA_SENHA}` }));
  if (password !== igual) redirect(para("/redefinir-senha", { erro: "As duas senhas precisam ser iguais." }));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(para("/esqueci-senha", { erro: "O link venceu. Peça um novo." }));

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(para("/redefinir-senha", { erro: "Não consegui trocar a senha. Peça um novo link." }));
  redirect("/app");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
