import { AxiosResponse } from "axios";
import { toast } from "sonner";

export const ensureSuccess = (res: AxiosResponse) => {
    if (res.status < 200 || res.status >= 300) {
        toast.error(`Error: ${res.status} ${res.statusText}`);
        throw new Error(`Request failed with status ${res.status}`);
    }
}