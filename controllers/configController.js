import configView from "../views/configView.js";
import configModel from "../models/configModel.js";

const configController = {
  async index() {
    await configView.render("config");
    configModel();
  },
};

export default configController;
