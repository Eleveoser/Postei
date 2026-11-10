import { EMPRESA } from "@/lib/empresa";
import { Documento, Lista, Secao } from "../documento";

export const metadata = { title: "Exclusão de dados | Postei" };

export default function ExclusaoDeDados() {
  return (
    <Documento titulo="Exclusão de dados">
      <p className="text-[15px] font-medium leading-relaxed text-[#2D3150]">
        Você pode pedir a exclusão da sua conta e dos seus dados no Postei a qualquer momento, sem custo.
      </p>

      <Secao titulo="Como pedir">
        <Lista
          itens={[
            `Envie um e-mail para ${EMPRESA.email}, a partir do e-mail cadastrado no Postei, com o assunto "Excluir minha conta".`,
            "Confirmamos o pedido por e-mail para garantir que ele é seu.",
            "Respondemos em até 15 dias e concluímos a exclusão em até 30 dias.",
          ]}
        />
      </Secao>

      <Secao titulo="O que é apagado">
        <Lista
          itens={[
            "os dados da sua conta e do seu negócio (nome, contato, serviços, @ do Instagram, logo e cores);",
            "a sua programação de posts, as legendas e os textos que você criou;",
            "o histórico de uso associado à sua conta.",
          ]}
        />
        <p>
          Podemos manter apenas o que a lei exige, como registros de cobrança e fiscais, pelo tempo que a lei determinar.
        </p>
      </Secao>

      <Secao titulo="Se você conectou o Instagram">
        <p>Para desconectar a qualquer momento, sem precisar nos escrever:</p>
        <Lista
          itens={[
            "no Instagram, abra Configurações e privacidade, depois Aplicativos e sites (ou Apps e sites), escolha o Postei e toque em Remover;",
            "ao excluir a sua conta no Postei, a conexão e qualquer dado dela também são apagados.",
          ]}
        />
      </Secao>

      <Secao titulo="Outros direitos">
        <p>
          Você também pode pedir acesso, correção ou portabilidade dos seus dados. Veja a{" "}
          <a href="/privacidade" className="font-extrabold underline">Política de Privacidade</a>.
        </p>
      </Secao>
    </Documento>
  );
}
