import { Card, CardHeader, Grid, Stack, TextField } from "@mui/material";
import BoardService from "../services/BoardService"
import AgilePlace from "../utils/AgilePlace";

import { useState } from 'react'

export default function Board({ host }) {

	const [boards, setBoards] = useState([]);
	const [filterText, setFilterText] = useState("");
	const [timer, setTimer] = useState(null);
	const [bsrv, setBsrv] = useState(null);
	const [pending, setPending] = useState(false);

	var bs = null;

	function cardClicked(evt) {
		document.open("/board/" + evt.currentTarget.id, "", "noopener=true")
	}

	function filterChange(e) {
		if (timer) {
			clearTimeout(timer)
		}
		setTimer(setTimeout(function () {
			updateList(e.target.value)
		}, 1000))
	}

	function updateList(txt) {
		setFilterText(txt);
		setPending(false);
	}

	async function getList(fltr) {
		if (fltr && (fltr.length == 0)) fltr = null;
		var result = await bs.find({search: fltr});
		return result;
	}

	if (bsrv == null) {
		bs = new BoardService(host);
		setBsrv(bs);
	}
	else {
		bs = bsrv;
	}

	if (!pending) {
		setPending(true);
		var ft = filterText;
		getList(ft).then((result) => result.json())
			.then((data) => {
				setBoards(data.boards);
			})
	}

	return <Stack>
		<TextField id="filter-basic" label="Filter" variant="standard" onChange={filterChange} />
		{(boards && boards.length) ?
			<Grid container>
				{boards.map((brd, key) => {
					return <Grid key={key} item>
						<Card
							id={brd.id}
							sx={{ width: 300 }}
							variant="outlined"
							onClick={cardClicked}
						>
							<CardHeader title={brd.title} />
						</Card>
					</Grid>
				})}
			</Grid>
			: null}
	</Stack>

}

export function getServerSideProps(context) {

	var props = { props: { host: context.req.headers.host } };
	//Find the url to this server and pass to client-side
	return props;
}