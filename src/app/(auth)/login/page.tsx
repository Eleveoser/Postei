import { signIn } from "../actions";
import { Aviso, CampoSenha, botao, campo } from "../ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; email?: string }>;
}) {
  const { erro, email } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em]">Entrar</h1>
        <p className="text-base font-medium text-[#4A4F6B]">Acesse o seu painel do Postei.</p>
      </div>

      {erro && <Aviso>{erro}</Aviso>}

      <form action={signIn} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-[15px] font-extrabold" htmlFor="email">
          E-mail
          <input id="email" name="email" type="email" required defaultValue={email ?? ""} autoComplete="email" autoCapitalize="none" autoCorrect="off" inputMode="email" placeholder="seuemail@exemplo.com" className={campo} />
        </label>
        <label className="flex flex-col gap-1.5 text-[15px] font-extrabold" htmlFor="password">
          Senha
          <CampoSenha placeholder="Sua senha" autoComplete="current-password" />
        </label>
        <button type="submit" className={botao}>Entrar</button>
        <a href="/esqueci-senha" className="min-h-11 text-center text-[15px] font-extrabold underline">Esqueci minha senha</a>
      </form>

      <p className="text-center text-[15px] font-medium text-[#4A4F6B]">
        Ainda não tem conta? <a href="/cadastro" className="font-extrabold text-[#0E1330] underline">Criar agora</a>
      </p>
    </div>
  );
}
