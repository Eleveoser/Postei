import { redefinirSenha } from "../actions";
import { Aviso, CampoSenha, botao } from "../ui";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em]">Crie uma senha nova</h1>
        <p className="text-base font-medium text-[#4A4F6B]">Escolha a senha que você vai usar daqui para frente.</p>
      </div>

      {erro && <Aviso>{erro}</Aviso>}

      <form action={redefinirSenha} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-[15px] font-extrabold" htmlFor="password">
          Senha nova
          <CampoSenha placeholder="Letras + números · 6 ou mais caracteres" autoComplete="new-password" />
        </label>
        <label className="flex flex-col gap-1.5 text-[15px] font-extrabold" htmlFor="password2">
          Repita a senha
          <CampoSenha id="password2" name="password2" placeholder="Digite a mesma senha" autoComplete="new-password" />
        </label>
        <button type="submit" className={botao}>Salvar senha nova</button>
      </form>
    </div>
  );
}
