import { EMPRESA } from "@/lib/empresa";
import { Documento, Lista, Secao } from "../documento";

export const metadata = { title: "Termos de Uso | Postei" };

export default function Termos() {
  return (
    <Documento titulo="Termos de Uso">
      <p className="text-[15px] font-medium leading-relaxed text-[#2D3150]">
        Estes termos valem para o uso do Postei, oferecido por {EMPRESA.nome} (CNPJ {EMPRESA.cnpj}). Ao criar a sua conta,
        você declara que leu e concorda com eles e com a{" "}
        <a href="/privacidade" className="font-extrabold underline">Política de Privacidade</a>.
      </p>

      <Secao titulo="1. O que é o Postei">
        <p>
          O Postei monta uma programação de posts para o Instagram do seu negócio, com artes e legendas prontas no estilo da
          sua marca, e oferece ferramentas para você criar seus próprios posts, como promoções e pacotes.
        </p>
      </Secao>

      <Secao titulo="2. Conta">
        <p>
          Você precisa ter 18 anos ou mais e informar dados verdadeiros. Você é responsável por manter a senha em segredo e
          por tudo o que acontece na sua conta.
        </p>
      </Secao>

      <Secao titulo="3. Planos, preços e cancelamento">
        <p>
          Os planos, os valores, o período de teste e a forma de cobrança são os informados no app no momento da contratação.
          Você pode cancelar quando quiser, e o cancelamento vale para as próximas cobranças. Nas contratações feitas pela
          internet, você também tem o direito de arrependimento de 7 dias, previsto no Código de Defesa do Consumidor.
        </p>
      </Secao>

      <Secao titulo="4. Responsabilidade pelo conteúdo">
        <p>
          Tudo o que você publica no seu perfil é de sua inteira responsabilidade. Isso inclui textos, imagens, preços,
          promoções, datas, depoimentos e qualquer informação, mesmo quando partirem de sugestões, modelos ou conteúdos do
          Postei.
        </p>
        <p>
          Cabe a você verificar se o conteúdo respeita as regras do seu conselho de classe (como CRM, CREFITO, CONFEF e CREF,
          conselhos de estética e outros), de qualquer órgão regulador e do Código de Defesa do Consumidor. Se houver qualquer
          impedimento ou penalidade de conselho de classe ou de outro órgão regulador por conteúdo publicado, a responsabilidade
          é sua e não do Postei.
        </p>
      </Secao>

      <Secao titulo="5. Sugestões do Postei">
        <p>
          A biblioteca de assuntos, as legendas e as artes são sugestões para ajudar a divulgar o seu negócio. Elas não são
          aconselhamento jurídico, de saúde ou técnico, e o Postei não garante resultados, como vendas, seguidores, alcance
          ou agendamentos.
        </p>
      </Secao>

      <Secao titulo="6. Propriedade intelectual">
        <p>
          O software, a biblioteca de conteúdo e a identidade do Postei pertencem a {EMPRESA.nome}. A sua marca, o seu logo,
          as suas fotos e os textos que você escreve continuam sendo seus. Você nos autoriza a usá-los apenas para prestar o
          serviço a você.
        </p>
      </Secao>

      <Secao titulo="7. Uso adequado">
        <p>Não é permitido usar o Postei para:</p>
        <Lista
          itens={[
            "publicar conteúdo ilegal, enganoso, ofensivo ou discriminatório;",
            "usar imagem de pessoas sem a autorização necessária;",
            "prometer resultado de saúde ou de beleza de forma que a lei ou o seu conselho proíba;",
            "tentar acessar dados de outras contas ou prejudicar o funcionamento do serviço.",
          ]}
        />
      </Secao>

      <Secao titulo="8. Publicação no Instagram (quando disponível)">
        <p>
          Se você conectar o Instagram, o Postei só publica o que você aprovar, no horário que você escolher. Você pode
          cancelar uma publicação antes do horário e desconectar a conta quando quiser. A aprovação fica registrada.
        </p>
      </Secao>

      <Secao titulo="9. Disponibilidade e mudanças">
        <p>
          Trabalhamos para manter o Postei funcionando, mas podem ocorrer interrupções por manutenção ou por falhas de
          terceiros. Podemos melhorar e alterar recursos. Se uma mudança relevante afetar o seu plano, avisaremos.
        </p>
      </Secao>

      <Secao titulo="10. Encerramento">
        <p>
          Você pode encerrar a conta quando quiser. Podemos suspender ou encerrar contas que descumpram estes termos, com
          aviso sempre que possível.
        </p>
      </Secao>

      <Secao titulo="11. Limite de responsabilidade">
        <p>
          Nos limites permitidos pela lei, o Postei não responde por danos indiretos, perda de lucros ou pelo conteúdo que
          você escolher publicar. Isso não afasta os direitos que o Código de Defesa do Consumidor garante a você.
        </p>
      </Secao>

      <Secao titulo="12. Mudanças nos termos, lei e foro">
        <p>
          Podemos atualizar estes termos e avisaremos sobre mudanças importantes. Estes termos seguem as leis do Brasil. Fica
          eleito o foro da comarca de {EMPRESA.cidade}, ressalvado o foro do consumidor quando a lei assim determinar. Dúvidas:{" "}
          {EMPRESA.email}.
        </p>
      </Secao>
    </Documento>
  );
}
