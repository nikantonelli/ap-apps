import React from "react";
import { getAvatar } from "../Utils/Client/Sdk";

export default class UserAvatar extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
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
        function _arrayBufferToBase64( buffer ) {
            var binary = '';
            var bytes = new Uint8Array( buffer );
            var len = bytes.byteLength;
            for (var i = 0; i < len; i++) {
                binary += String.fromCharCode( bytes[ i ] );
            }
            return window.btoa( binary );
        }
        getAvatar(this.props.host, this.props.id).then((result) =>
        {
            me.setState({ imageUrl: "data:image/jpeg;base64," + _arrayBufferToBase64(result)})
        })
    }

    render() {
        if (Boolean(this.state.imageUrl)) {
            return <img style={{ width: this.width, height: this.height }} alt={"User Avatar"} src={this.state.imageUrl} />
        }
        return null;
    }
}