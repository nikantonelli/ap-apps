import DataProvider from "../../../../utils/Server/DataProvider";

/**
 * Card redirection
 * @param {*} req 
 * @param {*} res 
 */
export default async function handler(req, res) {
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = new DataProvider()
	}
	try {
	  // some await stuff here
	  var id = req.query.id;
	  console.log(id)
	  res.redirect(301, globalThis.dataProvider.getCardUrl(id));
	} catch (err) {
	  res.status(500).send({ error: `Error while redirecting to ${globalThis.dataProvider.getHost()}` });
	}
  }