import { reenviarConfirmacao } from "../../actions";
import { Aviso, botao, botaoSecundario } from "../../ui";

export default async function ConfirmarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; pendente?: string; reenviado?: string }>;
}) {
  const { email = "", pendente, reenviado } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em]">
          {pendente ? "Falta confirmar o seu e-mail" : "Confira o seu e-mail"}
        </h1>
        <p className="text-base font-medium leading-snug text-[#4A4F6B]">
          Enviamos um link para <strong className="text-[#0E1330]">{email || "o seu e-mail"}</strong>. Toque nele para ativar a conta e continuar. Se não achar, olhe também o spam e a lixeira.
        </p>
      </div>

      {reenviado && <Aviso tipo="ok">Enviamos de novo. Pode levar alguns minutos.</Aviso>}

      <form action={reenviarConfirmacao} className="flex flex-col gap-3">
        <input type="hidden" name="email" value={email} />
        <button type="submit" className={botao}>Enviar o e-mail de novo</button>
      </form>
      <a href="/cadastro" className={botaoSecundario}>O e-mail está errado? Voltar e corrigir</a>
    </div>
  );
}
