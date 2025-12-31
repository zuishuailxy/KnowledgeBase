import { useRouteError } from 'react-router'

export default function Error() {
    const error = useRouteError() as any;
    console.log(error);
        
    return <div>{error.statusText}</div>
}
