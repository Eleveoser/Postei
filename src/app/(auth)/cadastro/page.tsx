import { signUp } from "../actions";
import { Aviso, CampoSenha, botao, campo } from "../ui";

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em]">Crie a sua conta</h1>
        <p className="text-base font-medium text-[#4A4F6B]">Em 2 minutos você monta a sua marca e recebe os primeiros posts.</p>
      </div>

      {erro && <Aviso>{erro}</Aviso>}

      <form action={signUp} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-[15px] font-extrabold" htmlFor="nome_negocio">
          Nome do seu negócio
          <input id="nome_negocio" name="nome_negocio" type="text" required placeholder="Ex: Studio Bela" autoComplete="organization" className={campo} />
        </label>
        <label className="flex flex-col gap-1.5 text-[15px] font-extrabold" htmlFor="email">
          E-mail
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            inputMode="email"
            placeholder="Confira com atenção: é por ele que você recebe seus avisos"
            className={campo}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[15px] font-extrabold" htmlFor="password">
          Senha
          <CampoSenha placeholder="Letras + números · 6 ou mais caracteres" autoComplete="new-password" />
        </label>
        <button type="submit" className={botao}>Criar conta e montar minha marca</button>
      </form>

      <p className="text-center text-[15px] font-medium text-[#4A4F6B]">
        Já tem conta? <a href="/login" className="font-extrabold text-[#0E1330] underline">Entrar</a>
      </p>
    </div>
  );
}
