import DataProvider from "../../../../Utils/Server/DataProvider";

/**
 * Board redirection
 * @param {*} req 
 * @param {*} res 
 */
export default async function handler(req, res) {
	if (!Boolean(globalThis.dataProvider)) {
		globalThis.dataProvider = new DataProvider()
	}
	try {
	  // some await stuff here
	  var id = req.query.id;
	  res.redirect(301, globalThis.dataProvider.getBoardUrl(id));
	} catch (err) {
		res.status(500).send({ error: `Error while redirecting to ${globalThis.dataProvider.getHost()}` });
	}
  }