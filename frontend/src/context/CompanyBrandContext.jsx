import { useEffect, useState } from "react";
import {
  atualizarConfiguracaoEmpresaApi,
  buscarConfiguracaoEmpresaApi,
} from "../services/configuracaoEmpresaApi";
import CompanyBrandContext from "./companyBrandContextBase";
import { IDENTIDADE_PADRAO } from "./companyBrandDefaults";

function luminanciaRelativa([vermelho, verde, azul]) {
  const canais = [vermelho, verde, azul].map((canal) => {
    const normalizado = canal / 255;
    return normalizado <= 0.04045
      ? normalizado / 12.92
      : ((normalizado + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
}

function ajustarParaTextoClaro(cor, contrasteMinimo = 5) {
  const correspondencia = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(cor);
  if (!correspondencia) return cor;

  let canais = correspondencia
    .slice(1)
    .map((canal) => Number.parseInt(canal, 16));
  const contrasteComBranco = () => 1.05 / (luminanciaRelativa(canais) + 0.05);

  while (contrasteComBranco() < contrasteMinimo) {
    canais = canais.map((canal) => Math.floor(canal * 0.92));
  }

  return `#${canais.map((canal) => canal.toString(16).padStart(2, "0")).join("")}`;
}

function aplicarIdentidade(configuracao) {
  const raiz = document.documentElement;
  raiz.style.setProperty(
    "--brand-primary",
    ajustarParaTextoClaro(configuracao.cor_primaria),
  );
  raiz.style.setProperty(
    "--brand-sidebar",
    ajustarParaTextoClaro(configuracao.cor_sidebar),
  );
  document.title = configuracao.nome_empresa;
}

export function CompanyBrandProvider({ children }) {
  const [configuracao, setConfiguracao] = useState(IDENTIDADE_PADRAO);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    buscarConfiguracaoEmpresaApi()
      .then((dados) => {
        if (ativo) setConfiguracao(dados);
      })
      .catch(() => {})
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => aplicarIdentidade(configuracao), [configuracao]);

  async function atualizarConfiguracao(dados) {
    const atualizada = await atualizarConfiguracaoEmpresaApi(dados);
    setConfiguracao(atualizada);
    return atualizada;
  }

  async function restaurarConfiguracao() {
    return atualizarConfiguracao(IDENTIDADE_PADRAO);
  }

  return (
    <CompanyBrandContext.Provider
      value={{
        configuracao,
        carregando,
        atualizarConfiguracao,
        restaurarConfiguracao,
      }}
    >
      {children}
    </CompanyBrandContext.Provider>
  );
}
