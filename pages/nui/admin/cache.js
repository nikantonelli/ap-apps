import { Button } from "@mui/material";

export default function page() {
    
    function invalidateCache() {
        globalThis.dataProvider.invalidateCaches()
    }

    return (
        <>
            {Boolean(globalThis.dataProvider) ?
                <Button variant="outlined" onClick={invalidateCache}>Invalidate Cache</Button>
                : null
            }
        </>
    )
}