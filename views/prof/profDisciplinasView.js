import Utils from "../../utils.js";

export function renderLista(container, disciplinas) {
  container.innerHTML = "";
  const tpl = document.getElementById("tpl-disciplina");
  disciplinas.forEach((d) => {
    const el = tpl.content.cloneNode(true);
    el.querySelector(".__nome").textContent = d.nome;
    el.querySelector(".__codigo").textContent = d.codigo_matricula;
    el.querySelector("[data-open]").setAttribute(
      "href",
      `/proftarefas?disc=${d.id_disciplina}`
    );
    el.querySelector("[data-copy]").addEventListener("click", async () => {
      await navigator.clipboard.writeText(d.codigo_matricula);
      Utils.showMessageToast(
        "success",
        "Código copiado",
        "Código copiado!",
        3000
      );
    });
    container.appendChild(el);
  });
}