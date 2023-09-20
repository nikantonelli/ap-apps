import React from "react";
import { getAvatar } from "../Utils/Client/Sdk";

export default class UserAvatar extends React.Component {
    constructor(props) {
        super(props)

        var state = {
            imageData: null,
            imageUrl: null
        }
        this.setup()
    }

    setup = () => {
        this.width = this.props.width || "25px"
        this.height = this.props.width || "25px"
    }

    componentDidUpdate = () => {
        this.setup()
    }

    componentDidMount() {
        var me = this;
        getAvatar(this.props.host, this.props.id).then(
            (result) =>
                 me.setState({ imageUrl: result })
        )
    }

    render() {
        if (Boolean(this.imageData)) {
            return <img style={{ width: this.width, height: this.height }} alt={"User Avatar"} src={this.imageUrl} />
        }
        return null;
    }
}