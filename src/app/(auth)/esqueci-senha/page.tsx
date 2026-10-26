import { pedirRedefinicao } from "../actions";
import { Aviso, botao, botaoSecundario, campo } from "../ui";

export default async function EsqueciSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; enviado?: string; email?: string }>;
}) {
  const { erro, enviado, email } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em]">Esqueci minha senha</h1>
        <p className="text-base font-medium text-[#4A4F6B]">Digite o e-mail da sua conta e enviamos um link para criar uma senha nova.</p>
      </div>

      {erro && <Aviso>{erro}</Aviso>}
      {enviado && (
        <Aviso tipo="ok">
          Se existe uma conta com {email ? <strong>{email}</strong> : "esse e-mail"}, o link já está a caminho. Olhe também o spam.
        </Aviso>
      )}

      <form action={pedirRedefinicao} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-[15px] font-extrabold" htmlFor="email">
          E-mail
          <input id="email" name="email" type="email" required defaultValue={email ?? ""} autoComplete="email" autoCapitalize="none" autoCorrect="off" inputMode="email" placeholder="seuemail@exemplo.com" className={campo} />
        </label>
        <button type="submit" className={botao}>{enviado ? "Enviar de novo" : "Enviar o link"}</button>
      </form>
      <a href="/login" className={botaoSecundario}>Voltar para entrar</a>
    </div>
  );
}
