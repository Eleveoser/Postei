import { EMPRESA } from "@/lib/empresa";
import { Documento, Lista, Secao } from "../documento";

export const metadata = { title: "Política de Privacidade | Postei" };

export default function Privacidade() {
  return (
    <Documento titulo="Política de Privacidade">
      <p className="text-[15px] font-medium leading-relaxed text-[#2D3150]">
        Esta política explica quais dados o Postei coleta, para que usa, com quem compartilha e como você pode controlar
        tudo isso, de acordo com a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).
      </p>

      <Secao titulo="1. Quem é responsável pelos seus dados">
        <p>
          {EMPRESA.nome}, inscrita no CNPJ {EMPRESA.cnpj}, é a controladora dos dados tratados no Postei. Para falar sobre
          privacidade, escreva para {EMPRESA.email}.
        </p>
      </Secao>

      <Secao titulo="2. Quais dados coletamos">
        <Lista
          itens={[
            "Conta: e-mail e senha. A senha é guardada de forma protegida pelo serviço de login e não conseguimos ler.",
            "Negócio: nome, tipo de negócio, serviços, bairro e cidade, telefone, WhatsApp, @ do Instagram, logo, cores, letra e tom de voz que você escolhe.",
            "Conteúdo: a programação de posts, as legendas que você edita e os textos, preços e datas que você escreve ao criar um post.",
            "Uso: ações dentro do app, como abrir, copiar uma legenda, baixar uma arte e marcar um post como publicado. Servem para entregar o serviço e melhorá-lo.",
            "Técnicos: tipo de aparelho e navegador, para mostrar o passo a passo de instalação e manter o app seguro.",
            "Pagamento: quando houver cobrança, os dados de pagamento são tratados pelo provedor de pagamento. Não guardamos número de cartão.",
          ]}
        />
      </Secao>

      <Secao titulo="3. Suas fotos">
        <p>
          Hoje, as artes são desenhadas no seu aparelho. As fotos que você escolhe para criar uma arte ficam no seu celular e
          não são enviadas aos nossos servidores. O logo que você envia no cadastro é guardado para aparecer nas suas artes.
        </p>
        <p>
          Se você ativar, no futuro, a publicação automática no Instagram, a imagem que você aprovar será enviada para um
          armazenamento temporário apenas para ser publicada e depois apagada.
        </p>
      </Secao>

      <Secao titulo="4. Para que usamos os dados e em que base legal">
        <Lista
          itens={[
            "Executar o contrato: criar a sua marca, montar a programação, gerar as artes e legendas e dar suporte.",
            "Cumprir obrigações legais, como as fiscais e as de guarda de registros.",
            "Legítimo interesse: segurança, prevenção de fraude, entender o uso do produto e melhorá-lo, sempre com o mínimo de dados.",
            "Consentimento: receber novidades e ofertas do Postei. Você pode retirar quando quiser.",
          ]}
        />
      </Secao>

      <Secao titulo="5. Com quem compartilhamos">
        <p>Não vendemos os seus dados. Compartilhamos apenas com quem presta serviços para o funcionamento do Postei:</p>
        <Lista
          itens={[
            "Hospedagem e banco de dados (por exemplo, Vercel e Supabase).",
            "Pagamento, quando houver cobrança (por exemplo, Asaas).",
            "Serviços de inteligência artificial, quando usados para gerar textos, recebendo só o necessário para essa tarefa.",
            "Autoridades, quando a lei exigir.",
          ]}
        />
      </Secao>

      <Secao titulo="6. Transferência para outros países">
        <p>
          Alguns provedores podem armazenar dados fora do Brasil. Nesses casos, buscamos provedores que adotem proteções
          compatíveis com a LGPD.
        </p>
      </Secao>

      <Secao titulo="7. Por quanto tempo guardamos">
        <p>
          Guardamos os dados enquanto a sua conta estiver ativa. Quando você pede a exclusão, apagamos ou anonimizamos os
          dados em até 30 dias, exceto o que a lei nos obriga a manter (por exemplo, registros de cobrança).
        </p>
      </Secao>

      <Secao titulo="8. Seus direitos">
        <p>Você pode pedir, a qualquer momento:</p>
        <Lista
          itens={[
            "confirmação de que tratamos dados seus e acesso a eles;",
            "correção de dados incompletos ou errados;",
            "anonimização, bloqueio ou eliminação de dados desnecessários;",
            "portabilidade dos dados;",
            "informação sobre com quem compartilhamos;",
            "retirada do consentimento e exclusão da conta.",
          ]}
        />
        <p>
          Para exercer qualquer direito, escreva para {EMPRESA.email} a partir do e-mail cadastrado. Respondemos em até 15
          dias. Veja também a página de <a href="/exclusao-de-dados" className="font-extrabold underline">exclusão de dados</a>.
        </p>
      </Secao>

      <Secao titulo="9. Conexão com o Instagram (quando disponível)">
        <p>
          Se você conectar a sua conta do Instagram, pediremos somente as permissões necessárias para publicar o conteúdo
          que você aprovar. O Postei não publica nada sem a sua aprovação. Você pode desconectar a qualquer momento, no Postei
          ou nas configurações do Instagram, e a conexão deixa de funcionar.
        </p>
      </Secao>

      <Secao titulo="10. Cookies e armazenamento no aparelho">
        <p>
          Usamos cookies essenciais para manter você conectada e armazenamento local do navegador para lembrar escolhas,
          como o aviso de instalação do app. Não usamos cookies de publicidade.
        </p>
      </Secao>

      <Secao titulo="11. Segurança">
        <p>
          Adotamos medidas técnicas e organizacionais para proteger os dados, como conexão criptografada e controle de acesso.
          Se houver um incidente que possa trazer risco a você, avisaremos você e a autoridade competente, como a lei exige.
        </p>
      </Secao>

      <Secao titulo="12. Quem pode usar">
        <p>O Postei é destinado a maiores de 18 anos e a pessoas jurídicas que divulgam o próprio negócio.</p>
      </Secao>

      <Secao titulo="13. Mudanças nesta política">
        <p>
          Podemos atualizar esta política. Quando a mudança for importante, avisaremos no app ou por e-mail. A data da última
          versão está no topo da página.
        </p>
      </Secao>
    </Documento>
  );
}
