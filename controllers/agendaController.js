import agendaView from "../views/agendaView.js";
import agendaModel from "../models/agendaModel.js";

const agendaController = {
  async index() {
    await agendaView.render("agenda");
    agendaModel();
  },
};

export default agendaController;
