import { useEffect, useState } from "react";
import CrudTable from "../components/CrudTable";
import equipamentoService from "../services/equipamentoService";
import departamentoService from "../services/departamentoService";
import { useAuth } from "../auth/AuthContext";
import { PapelUsuario } from "../enum/PapelUsuario";

export default function Equipamentos() {
  const [departamentos, setDepartamentos] = useState([]);
  const { usuario } = useAuth();

  useEffect(() => {
    departamentoService.listar().then(setDepartamentos);
  }, []);

  const campos = [
    { name: "nome", label: "Nome", required: true },
    { name: "tipo", label: "Tipo", required: true },
    { name: "numeroSerie", label: "Número de série", required: true },
    {
      name: "departamentoId",
      label: "Departamento",
      type: "select",
      numeric: true,
      options: departamentos.map((d) => ({ value: d.id, label: d.nome })),
    },
  ];

  const colunas = [
    { key: "nome", label: "Nome" },
    { key: "tipo", label: "Tipo" },
    { key: "numeroSerie", label: "Nº de série" },
  ];

  const podeEscrever = usuario.papel === PapelUsuario.ADMIN || usuario.papel === PapelUsuario.TECNICO;

  return (
    <CrudTable
      titulo="Equipamentos"
      colunas={colunas}
      campos={campos}
      service={equipamentoService}
      podeEscrever={podeEscrever}
    />
  );
}
