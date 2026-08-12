import { useEffect, useState } from "react";
import CrudTable from "../components/CrudTable";
import usuarioService from "../services/usuarioService";
import departamentoService from "../services/departamentoService";
import { PAPEL_USUARIO_VALORES } from "../enum/PapelUsuario";
import { PAPEL_LABEL } from "../constants/labels";

export default function Usuarios() {
  const [departamentos, setDepartamentos] = useState([]);

  useEffect(() => {
    departamentoService.listar().then(setDepartamentos);
  }, []);

  const campos = [
    { name: "nome", label: "Nome", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "senha", label: "Senha (em branco mantém a atual)", type: "password" },
    {
      name: "papel",
      label: "Perfil",
      type: "select",
      required: true,
      options: PAPEL_USUARIO_VALORES.map((p) => ({ value: p, label: PAPEL_LABEL[p] })),
    },
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
    { key: "email", label: "Email" },
    { key: "papel", label: "Perfil", render: (r) => PAPEL_LABEL[r.papel] },
  ];

  return <CrudTable titulo="Usuários" colunas={colunas} campos={campos} service={usuarioService} />;
}
