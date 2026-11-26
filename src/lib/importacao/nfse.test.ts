import { describe, expect, it } from "vitest";
import { lerNfse } from "@/lib/importacao/nfse";

const GINFES = `<?xml version="1.0"?>
<ns3:ConsultarNfseResposta xmlns:ns3="http://www.ginfes.com.br/servico_consultar_nfse_resposta_v03.xsd" xmlns:ns4="http://www.ginfes.com.br/tipos_v03.xsd">
  <ns3:ListaNfse><ns3:CompNfse><ns4:Nfse><ns4:InfNfse>
    <ns4:Numero>1234</ns4:Numero>
    <ns4:Competencia>2026-10-15T00:00:00</ns4:Competencia>
    <ns4:Servico>
      <ns4:Valores>
        <ns4:ValorServicos>10000.00</ns4:ValorServicos>
        <ns4:ValorPis>65.00</ns4:ValorPis><ns4:ValorCofins>300.00</ns4:ValorCofins><ns4:ValorCsll>100.00</ns4:ValorCsll><ns4:ValorIr>150.00</ns4:ValorIr>
        <ns4:IssRetido>2</ns4:IssRetido><ns4:ValorIss>200.00</ns4:ValorIss><ns4:Aliquota>2</ns4:Aliquota>
        <ns4:BaseCalculo>10000.00</ns4:BaseCalculo>
      </ns4:Valores>
      <ns4:Discriminacao>Servicos medicos prestados DR JOAO DA SILVA DADOS BANCARIOS BANCO ITAU - 341 AGENCIA: 1234 CONTA: 56789-0 PIX: joao@exemplo.com</ns4:Discriminacao>
    </ns4:Servico>
    <ns4:PrestadorServico>
      <ns4:IdentificacaoPrestador><ns4:Cnpj>11222333000181</ns4:Cnpj></ns4:IdentificacaoPrestador>
      <ns4:RazaoSocial>CLINICA MEDICA EXEMPLO LTDA</ns4:RazaoSocial>
    </ns4:PrestadorServico>
    <ns4:TomadorServico>
      <ns4:IdentificacaoTomador><ns4:CpfCnpj><ns4:Cnpj>45723174000110</ns4:Cnpj></ns4:CpfCnpj></ns4:IdentificacaoTomador>
      <ns4:RazaoSocial>HOSPITAL SAO LUCAS LTDA</ns4:RazaoSocial>
    </ns4:TomadorServico>
  </ns4:InfNfse></ns4:Nfse></ns3:CompNfse></ns3:ListaNfse>
</ns3:ConsultarNfseResposta>`;

describe("lerNfse", () => {
  it("lê o layout Ginfes com namespaces", () => {
    const n = lerNfse(GINFES, "nota.xml");
    expect(n).toMatchObject({
      numeroNfs: "1234",
      competencia: "2026-10-01",
      clienteNome: "HOSPITAL SAO LUCAS LTDA",
      clienteDocumento: "45723174000110",
      empresaContabilNome: "CLINICA MEDICA EXEMPLO LTDA",
      empresaContabilCnpj: "11222333000181",
      valorNf: 10000,
      situacao: "pendente",
    });
    expect(n.aliquotas).toEqual({ pis: 0.65, cofins: 3, csll: 1, ir: 1.5, iss: 2 });
  });
  it("tira o médico e os dados bancários da discriminação", () => {
    const n = lerNfse(GINFES);
    expect(n.prestadorNome).toBe("JOAO DA SILVA");
    expect(n.banco).toBe("ITAU - 341");
    expect(n.agencia).toBe("1234");
    expect(n.conta).toBe("56789-0");
    expect(n.chavePix).toBe("JOAO@EXEMPLO.COM");
  });
  it("prestador pessoa física: CPF e nome do próprio prestador; ISS retido zera a alíquota", () => {
    const xml = `<Nfse><Numero>9</Numero><DataEmissao>03/11/2026</DataEmissao><ValorServicos>1.000,00</ValorServicos><IssRetido>1</IssRetido><ValorIss>50,00</ValorIss>
      <Prestador><Cpf>52998224725</Cpf><RazaoSocial>MARIA HELENA PRADO</RazaoSocial></Prestador><Tomador><Cnpj>45723174000110</Cnpj><RazaoSocial>Clinica X</RazaoSocial></Tomador><Situacao>2</Situacao></Nfse>`;
    const n = lerNfse(xml);
    expect(n).toMatchObject({ prestadorNome: "MARIA HELENA PRADO", prestadorCpf: "52998224725", empresaContabilCnpj: "", competencia: "2026-11-01", valorNf: 1000, situacao: "cancelado" });
    expect(n.aliquotas.iss).toBe(0);
  });
  it("XML quebrado dá erro com o nome do arquivo", () => {
    expect(() => lerNfse("<a><b></a>", "ruim.xml")).toThrow("XML inválido: ruim.xml");
  });
});
