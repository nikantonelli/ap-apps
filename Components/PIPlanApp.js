import React from "react";
export class PIPlanApp extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			
		}
	}

	render() {
		return (<column>
		<ul>
			<li>
				<input id="rad1" type="radio" name="rad"/><label for="rad1"><div>Configuration</div></label>
				<div class="accslide">
					<div class="content">
						<h1>
							GetStarted
						</h1>
						<p>
							Content
						</p>
					</div>
				</div>
			</li>
			<li>
				<input id="rad2" type="radio" name="rad"/><label for="rad2"><div>PI Planning</div></label>
				<div class="accslide">
					<div class="content">
						<h1>
							PI Planning
						</h1>
						<p>
							Go
						</p>
					</div>
				</div>
			</li>
		</ul>


		</column>)
	}
}